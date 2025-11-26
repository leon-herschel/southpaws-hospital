<?php
require __DIR__ . '/vendor/autoload.php';
use Dotenv\Dotenv;

// Load .env.domain
$dotenv = Dotenv::createImmutable(__DIR__, '.env.domain');
$dotenv->load();

class DbConnect {
    private $server;
    private $dbname;
    private $user;
    private $pass;

    public function __construct() {
        $this->server = $_ENV['DB_HOST'];
        $this->dbname = $_ENV['DB_NAME'];
        $this->user = $_ENV['DB_USER'];
        $this->pass = $_ENV['DB_PASS'];
    }

    public function connect() {
        try {
            $conn = new PDO(
                'mysql:host=' . $this->server . ';dbname=' . $this->dbname, 
                $this->user, 
                $this->pass
            );
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $conn;
        } catch (\Exception $e) {
            echo "Database Error: " . $e->getMessage();
        }
    }
}
?>
