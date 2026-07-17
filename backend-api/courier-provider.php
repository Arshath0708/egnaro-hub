<?php
// courier-provider.php — Production-grade Logistics API Connector
// Renamed from shiprocket-client.php for security obscurity

class CourierProvider {
    private $email;
    private $password;
    private $token = null;
    private $token_cache_file;
    private $api_base = "https://apiv2.shiprocket.in/v1/external";
    public $debug_info = [];

    public function __construct() {
        // Load credentials from environment or config definitions
        $this->email = defined('SHIPROCKET_EMAIL') ? SHIPROCKET_EMAIL : 'admin@egnaromart.com';
        $this->password = defined('SHIPROCKET_PASSWORD') ? SHIPROCKET_PASSWORD : 'Password123!';
        $this->token_cache_file = dirname(__FILE__) . '/.courier_token_cache';
    }

    /**
     * Authenticates with courier partner and caches JWT token to prevent rate-limit penalties
     */
    private function authenticate() {
        // Cache validity: reuse token for 8 days (validity window is 10 days)
        if (file_exists($this->token_cache_file) && (time() - filemtime($this->token_cache_file) < 86400 * 8)) {
            $cached = file_get_contents($this->token_cache_file);
            if (!empty($cached)) {
                $this->token = $cached;
                return $this->token;
            }
        }

        $url = "https://apiv2.shiprocket.in/v1/external/auth/login";
        $payload = json_encode([
            "email" => $this->email,
            "password" => $this->password
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json"
        ]);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // Log authentication debug info
        $this->debug_info['auth'] = [
            "url" => $url,
            "method" => "POST",
            "request_headers" => ["Content-Type: application/json"],
            "request_body" => json_encode([
                "email" => $this->email,
                "password" => "[MASKED]"
            ]),
            "http_code" => $http_code,
            "raw_response" => $response
        ];

        if ($http_code === 200) {
            $data = json_decode($response, true);
            if (isset($data['token'])) {
                $this->token = $data['token'];
                // Write to cache
                file_put_contents($this->token_cache_file, $this->token);
                return $this->token;
            }
        }

        throw new Exception("Logistics OAuth login failed (HTTP $http_code). Response: " . $response);
    }

    /**
     * Executes curl requests with auth headers, handles token invalidation retries
     */
    private function request($endpoint, $method = "GET", $body = null, $is_retry = false) {
        $token = $this->authenticate();
        $url = $endpoint;
        if (!str_starts_with($url, "http")) {
            $url = $this->api_base . $endpoint;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $headers = [
            "Content-Type: application/json",
            "Authorization: Bearer " . $token
        ];

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            $this->debug_info['last_request'] = [
                "url" => $url,
                "method" => $method,
                "request_headers" => $headers,
                "request_body" => $body !== null ? json_encode($body) : null,
                "http_code" => $http_code,
                "curl_error" => $err,
                "raw_response" => null
            ];
            throw new Exception("CURL Connection Error: " . $err);
        }

        $data = json_decode($response, true) ?: $response;

        $this->debug_info['last_request'] = [
            "url" => $url,
            "method" => $method,
            "request_headers" => $headers,
            "request_body" => $body !== null ? json_encode($body) : null,
            "http_code" => $http_code,
            "curl_error" => null,
            "raw_response" => $data
        ];

        // If unauthorized and we haven't retried yet, invalidate token cache and try again
        if ($http_code === 401 && !$is_retry) {
            if (file_exists($this->token_cache_file)) {
                @unlink($this->token_cache_file);
            }
            $this->token = null;
            return $this->request($endpoint, $method, $body, true);
        }

        return [
            "code" => $http_code,
            "data" => $data
        ];
    }

    /**
     * Checks courier serviceability between two pincodes
     */
    public function checkServiceability($pickup_pincode, $delivery_pincode, $weight_g) {
        $weight_kg = floatval($weight_g) / 1000.0;
        $endpoint = "/courier/serviceability/?pickup_postcode=" . urlencode($pickup_pincode) . 
                    "&delivery_postcode=" . urlencode($delivery_pincode) . 
                    "&weight=" . urlencode($weight_kg) . "&cod=1";
        
        $res = $this->request($endpoint, "GET");
        return $res['data'];
    }

    /**
     * Creates an order/consignment in courier partner systems
     */
    public function createOrder($order_payload) {
        $endpoint = "/orders/create/adhoc";
        $res = $this->request($endpoint, "POST", $order_payload);
        if ($res['code'] === 200 || $res['code'] === 201) {
            $data = $res['data'];
            if (isset($data['status_code']) && intval($data['status_code']) !== 1) {
                $msg = $data['message'] ?? (isset($data['errors']) ? json_encode($data['errors']) : 'Internal validation failure');
                throw new Exception("Logistics Order Booking Failed (Status " . $data['status_code'] . "): " . $msg);
            }
            return $data;
        }
        throw new Exception("Logistics Order Booking Failed (HTTP " . $res['code'] . "): " . json_encode($res['data']));
    }

    /**
     * Assigns courier and retrieves AWB code
     */
    public function assignAWB($shipment_id, $courier_id = null) {
        $endpoint = "/courier/assign/awb";
        $payload = [
            "shipment_id" => $shipment_id
        ];
        if ($courier_id !== null) {
            $payload["courier_id"] = $courier_id;
        }

        $res = $this->request($endpoint, "POST", $payload);
        if ($res['code'] === 200) {
            return $res['data'];
        }
        throw new Exception("Logistics AWB Assignment Failed: " . json_encode($res['data']));
    }

    /**
     * Generates a printable shipping label URL
     */
    public function generateLabel($shipment_ids) {
        $endpoint = "/courier/generate/label";
        $payload = [
            "shipment_ids" => is_array($shipment_ids) ? $shipment_ids : [$shipment_ids]
        ];

        $res = $this->request($endpoint, "POST", $payload);
        if ($res['code'] === 200) {
            return $res['data'];
        }
        throw new Exception("Logistics Label Generation Failed: " . json_encode($res['data']));
    }

    /**
     * Generates a printable courier manifest URL
     */
    public function generateManifest($shipment_ids) {
        $endpoint = "/courier/generate/manifest";
        $payload = [
            "shipment_ids" => is_array($shipment_ids) ? $shipment_ids : [$shipment_ids]
        ];

        $res = $this->request($endpoint, "POST", $payload);
        if ($res['code'] === 200) {
            return $res['data'];
        }
        throw new Exception("Logistics Manifest Generation Failed: " . json_encode($res['data']));
    }

    /**
     * Requests courier pickup
     */
    public function requestPickup($shipment_ids, $pickup_date = null) {
        $endpoint = "/courier/generate/pickup";
        $payload = [
            "shipment_ids" => is_array($shipment_ids) ? $shipment_ids : [$shipment_ids]
        ];
        if ($pickup_date !== null) {
            $payload["pickup_date"] = $pickup_date;
        }

        $res = $this->request($endpoint, "POST", $payload);
        if ($res['code'] === 200) {
            return $res['data'];
        }
        throw new Exception("Logistics Pickup Request Failed: " . json_encode($res['data']));
    }

    /**
     * Registers or updates a pickup location in Shiprocket systems
     */
    public function registerPickupLocation($payload) {
        $endpoint = "/settings/company/addpickup";
        $res = $this->request($endpoint, "POST", $payload);
        if ($res['code'] === 200 || $res['code'] === 201) {
            return $res['data'];
        }
        throw new Exception("Logistics Pickup Location Registration Failed: " . json_encode($res['data']));
    }

    /**
     * Cancels an order/consignment in Shiprocket systems
     */
    public function cancelOrder($shiprocket_order_id) {
        $endpoint = "/orders/cancel";
        $payload = [
            "ids" => [intval($shiprocket_order_id)]
        ];
        $res = $this->request($endpoint, "POST", $payload);
        if ($res['code'] === 200) {
            return $res['data'];
        }
        throw new Exception("Logistics Order Cancellation Failed: " . json_encode($res['data']));
    }

    /**
     * Retrieves tracking checkpoints for an AWB tracking code
     */
    public function trackAWB($awb_code) {
        $endpoint = "/courier/track/awb/" . urlencode($awb_code);
        $res = $this->request($endpoint, "GET");
        if ($res['code'] === 200) {
            return $res['data'];
        }
        throw new Exception("Logistics AWB Tracking Failed: " . json_encode($res['data']));
    }
}
?>
