-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 02, 2025 at 03:27 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `react-crud`
--

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `name`, `created_by`, `updated_by`, `created_at`, `archived`) VALUES
(5, 'ritemed', 1, 0, '2025-04-02 02:14:22', 0);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_by`, `updated_by`, `created_at`, `archived`) VALUES
(5, 'capsule', 1, 0, '2025-03-13 14:46:29', 0),
(6, 'we', 1, 0, '2025-03-13 16:08:14', 0);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(100) NOT NULL,
  `name` varchar(1000) NOT NULL,
  `age` int(11) NOT NULL,
  `address` varchar(1000) NOT NULL,
  `cellnumber` varchar(1000) NOT NULL,
  `email` varchar(1000) NOT NULL,
  `gender` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(100) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `archived` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `age`, `address`, `cellnumber`, `email`, `gender`, `created_at`, `created_by`, `updated_by`, `archived`) VALUES
(1, 'Albert Froilan Impas', 2, 'Paknaan Mandaue City Zone(Tamatis)', '09686370059', 'alfr.impas.swu@phinmaed.com', 'male', '2025-04-02 02:14:22', 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `generic_cms`
--

CREATE TABLE `generic_cms` (
  `id` int(11) NOT NULL,
  `generic_name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `generic_cms`
--

INSERT INTO `generic_cms` (`id`, `generic_name`, `created_by`, `created_at`, `updated_by`) VALUES
(2, '1234', 3, '2025-02-06 20:03:45', 0),
(4, '123', 3, '2025-02-06 13:31:20', 0),
(5, 'AntiBiosi', 8, '2025-02-08 04:56:23', 0),
(6, 'Albert', 8, '2025-02-08 22:40:17', 0),
(7, 'asdas', 1, '2025-02-12 00:09:42', 0),
(8, '23asd', 1, '2025-02-12 00:09:57', 0),
(9, 'tonsil', 1, '2025-02-12 00:11:35', 0),
(10, 'sdasd1231asxczx', 1, '2025-02-12 00:13:17', 0),
(11, '123asda', 1, '2025-02-12 00:15:14', 0),
(12, 'albertimpas', 1, '2025-02-12 00:15:27', 0),
(13, 'aasnmdojnqwjen', 1, '2025-02-12 00:16:33', 0),
(14, 'asdqojwebiuqwbe123', 1, '2025-02-12 00:17:42', 0),
(15, 'albertimpas23', 1, '2025-02-12 00:19:11', 0);

-- --------------------------------------------------------

--
-- Table structure for table `immunization_form`
--

CREATE TABLE `immunization_form` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `patient_id` varchar(255) NOT NULL,
  `pet_image` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `signature` tinyint(4) NOT NULL,
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `immunization_form`
--

INSERT INTO `immunization_form` (`id`, `client_id`, `patient_id`, `pet_image`, `created_at`, `signature`, `created_by`) VALUES
(20, 1, '11,13', 'uploads/1742779355_captured_image.jpg', '2025-03-23 16:00:00', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `immunization_notes`
--

CREATE TABLE `immunization_notes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `last_updated` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `internal_users`
--

CREATE TABLE `internal_users` (
  `id` int(100) NOT NULL,
  `email` varchar(1000) NOT NULL,
  `first_name` varchar(1000) NOT NULL,
  `last_name` varchar(1000) NOT NULL,
  `password` varchar(1000) NOT NULL,
  `user_role` int(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_token_created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `internal_users`
--

INSERT INTO `internal_users` (`id`, `email`, `first_name`, `last_name`, `password`, `user_role`, `created_at`, `verification_token`, `verification_token_created_at`, `reset_token`, `is_verified`) VALUES
(1, 'alfr.impas.swu@phinmaed.com', 'Albert', 'Impas', '$2y$10$Sh/pn7CxY/3PQYFzy8u99.e5NwArdLgB3xYSm87/3B.h6xy.4KRge', 1, '2025-03-23 15:38:29', NULL, '2025-02-08 03:20:36', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `sku` varchar(255) NOT NULL,
  `barcode` varchar(255) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) NOT NULL,
  `price` double NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_count` int(11) NOT NULL,
  `item_sold` int(11) NOT NULL,
  `expiration_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `archived` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `sku`, `barcode`, `product_id`, `supplier_id`, `price`, `quantity`, `total_count`, `item_sold`, `expiration_date`, `created_at`, `created_by`, `updated_by`, `archived`) VALUES
(7, '1234QWE', '1234', 7, 5, 10, 10, 110, 11, '2025-03-14', '2025-02-13 13:45:21', 1, 8, 0),
(8, '', '123', 8, 6, 231, 10, 22, 10, '2025-03-13', '2025-02-13 17:12:01', 1, 0, 0),
(9, '1234', '', 10, 6, 1234, 246, 246, 0, '2025-03-14', '2025-03-13 22:58:32', 8, 8, 0),
(13, '1234QWE231', '', 10, 5, 12, 100, 100, 0, NULL, '2025-03-13 23:14:24', 8, 8, 0),
(14, 'dasd123', '5b29264ed856', 10, 5, 1234, 123, 123, 0, '2025-03-01', '2025-03-13 23:47:14', 8, 8, 0),
(15, '123EAE', '8c33515a', 9, 5, 10, 123, 123, 0, '0000-00-00', '2025-04-09 14:41:18', 1, 0, 0),
(16, '123eaed', 'de683cd599c1', 12, 5, 1234, 100, 100, 0, '2025-04-10', '2025-04-09 14:41:47', 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `history` text DEFAULT NULL,
  `diagnostic_plan` text DEFAULT NULL,
  `differentials` text DEFAULT NULL,
  `treatment_plan` text DEFAULT NULL,
  `veterinarian` varchar(255) DEFAULT NULL,
  `heart_rate` varchar(255) DEFAULT NULL,
  `lymph_nodes` varchar(255) DEFAULT NULL,
  `respiratory_rate` varchar(255) DEFAULT NULL,
  `abdomen` varchar(255) DEFAULT NULL,
  `bcs` varchar(255) DEFAULT NULL,
  `cardiovascular` varchar(255) DEFAULT NULL,
  `general_appearance` varchar(255) DEFAULT NULL,
  `respiratory` varchar(255) DEFAULT NULL,
  `mm` varchar(255) DEFAULT NULL,
  `genitourinary` varchar(255) DEFAULT NULL,
  `ears` varchar(255) DEFAULT NULL,
  `integument` varchar(255) DEFAULT NULL,
  `eyes` varchar(255) DEFAULT NULL,
  `musculoskeletal` varchar(255) DEFAULT NULL,
  `nose` varchar(255) DEFAULT NULL,
  `neuro` varchar(255) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_records`
--

INSERT INTO `medical_records` (`id`, `patient_id`, `chief_complaint`, `history`, `diagnostic_plan`, `differentials`, `treatment_plan`, `veterinarian`, `heart_rate`, `lymph_nodes`, `respiratory_rate`, `abdomen`, `bcs`, `cardiovascular`, `general_appearance`, `respiratory`, `mm`, `genitourinary`, `ears`, `integument`, `eyes`, `musculoskeletal`, `nose`, `neuro`, `date`, `created_by`, `created_at`) VALUES
(6, 10, '', '', '', '', '', '', '23', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2025-02-09 21:17:54', 0, '2025-03-24 10:24:37'),
(7, 11, '', '', '', '', '', '', '123', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2025-02-14 00:25:01', 0, '2025-03-24 10:24:37'),
(8, 11, '', '', '', '', '', '', '231', '231', '', 'asd', '', '', '', '', '', '', '', '', '', '', '', '', '2025-02-14 00:26:34', 0, '2025-03-24 10:24:37'),
(9, 11, '', '', '', '', '', '', '123', 'asd123', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2025-02-14 00:27:45', 0, '2025-03-24 10:24:37'),
(10, 11, '', '', '', '', '', '', '123asd', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2025-02-14 00:29:24', 0, '2025-03-24 10:24:37'),
(11, 13, '', '', '', '', '', '', '123', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2025-03-14 08:31:23', 0, '2025-03-24 10:24:37'),
(12, 11, '123', '123', '123', '123', '123', '123', '123', '1', '12', '3123123', '123', '123123', '1231', '231', '231312', '1231', '123', '1231', '231', '23', '123', '12', '2025-03-24 02:35:40', 1, '2025-03-24 10:35:40'),
(13, 13, '123', '123123', '1231', '123', '1231', '231', '123', '1123', '1231231', '2312', '312', '3123', '12', '3123', '12', '3', '123', '123', '12', '3', '123', '123', '2025-03-24 02:38:00', 1, '2025-03-24 10:38:00');

-- --------------------------------------------------------

--
-- Table structure for table `medications`
--

CREATE TABLE `medications` (
  `id` int(100) NOT NULL,
  `patient_id` int(100) NOT NULL,
  `medication_name` varchar(1000) NOT NULL,
  `prescribed_by` int(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `pet_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pet_id`)),
  `order_date` datetime DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `grand_total` decimal(10,2) DEFAULT NULL,
  `confirmed_by` varchar(255) DEFAULT NULL,
  `receipt_number` varchar(255) DEFAULT NULL,
  `unregistered_client_id` int(11) DEFAULT NULL,
  `amount_tendered` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `client_id`, `pet_id`, `order_date`, `tax_amount`, `grand_total`, `confirmed_by`, `receipt_number`, `unregistered_client_id`, `amount_tendered`) VALUES
(1, NULL, '[]', '2025-03-10 21:16:30', 0.50, 10.00, 'Albert', '10032025-275', 12, 10),
(2, 1, '[13]', '2025-03-10 21:41:50', 0.50, 10.00, 'Albert', '10032025-171', NULL, 10),
(3, 1, '[]', '2025-03-13 22:09:33', 23.10, 231.00, 'Albert', '13032025-156', NULL, 231),
(4, 1, '[]', '2025-03-13 22:10:08', 23.10, 231.00, 'Albert', '13032025-533', NULL, 231),
(5, 1, '[]', '2025-03-13 22:10:27', 23.10, 231.00, 'Albert', '13032025-512', NULL, 231),
(6, 1, '\"\"', '2025-03-13 22:13:31', 23.10, 231.00, 'Albert', '13032025-866', NULL, 231),
(7, 1, '\"\"', '2025-03-13 22:19:01', 23.10, 231.00, 'Albert', '13032025-043', NULL, 231),
(8, 1, '\"\"', '2025-03-13 22:21:50', 23.10, 231.00, 'Albert', '13032025-061', NULL, 231),
(9, 1, '\"\"', '2025-03-13 22:23:23', 23.10, 231.00, 'Albert', '13032025-338', NULL, 231),
(10, 1, '[]', '2025-03-13 22:24:32', 23.10, 231.00, 'Albert', '13032025-090', NULL, 231),
(11, 1, '\"\"', '2025-03-13 22:26:22', 23.10, 231.00, 'Albert', '13032025-849', NULL, 231),
(12, 1, '[13]', '2025-03-13 22:27:10', 23.10, 231.00, 'Albert', '13032025-515', NULL, 231),
(13, 1, '\"\"', '2025-03-13 22:28:36', 23.10, 231.00, 'Albert', '13032025-893', NULL, 231);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_name`, `quantity`, `price`, `total`, `type`) VALUES
(1, 1, 'Food', 1, 10.00, 10.00, 'product'),
(2, 2, 'Food', 1, 10.00, 10.00, 'product'),
(3, 3, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(4, 4, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(5, 5, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(6, 6, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(7, 7, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(8, 8, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(9, 9, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(10, 10, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(11, 11, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(12, 12, 'ALBERTT', 1, 231.00, 231.00, 'product'),
(13, 13, 'ALBERTT', 1, 231.00, 231.00, 'product');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(100) NOT NULL,
  `owner_id` int(100) NOT NULL,
  `name` varchar(1000) NOT NULL,
  `species` varchar(1000) NOT NULL,
  `breed` varchar(100) NOT NULL,
  `weight` double NOT NULL,
  `age` varchar(255) NOT NULL,
  `birthdate` date NOT NULL,
  `distinct_features` varchar(1000) NOT NULL,
  `other_details` varchar(1000) NOT NULL,
  `created_by` int(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `owner_id`, `name`, `species`, `breed`, `weight`, `age`, `birthdate`, `distinct_features`, `other_details`, `created_by`, `created_at`) VALUES
(11, 1, 'Angel', 'canine', '123', 2312, '2 days', '2025-02-10', '1234', '1234', 1, '2025-02-12 02:05:26'),
(13, 1, 'John Doe', 'canine', '1231', 232, 'Less than a day old', '2025-02-12', '24', '23', 1, '2025-02-12 02:05:39');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `generic_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) NOT NULL,
  `archived` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `product_name`, `generic_id`, `unit_id`, `category_id`, `brand_id`, `created_at`, `created_by`, `updated_by`, `archived`) VALUES
(7, 'Food', 5, 7, 6, 5, '2025-03-14 05:29:18', 1, 8, 0),
(8, 'ALBERTT', 4, 7, 6, 5, '2025-03-14 05:07:22', 1, 8, 0),
(9, 'ALBERTTSDASDA', 5, 7, 5, 5, '2025-03-14 05:26:33', 8, 8, 0),
(10, '123', 5, 7, 5, 5, '2025-03-14 05:31:06', 8, 8, 0),
(11, 'NEWFOODASDA', 5, 7, 5, 5, '2025-03-13 22:15:44', 8, 0, 0),
(12, 'DASD', 4, 7, 5, 5, '2025-03-13 22:31:15', 8, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `change_given` decimal(10,2) DEFAULT NULL,
  `receipt_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `receipt_number` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(1000) NOT NULL,
  `price` double NOT NULL,
  `consent_form` enum('Immunization Form','Surgical Form','None','') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `status` enum('Available','Unavailable') NOT NULL DEFAULT 'Available',
  `archived` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `price`, `consent_form`, `created_at`, `created_by`, `status`, `archived`) VALUES
(2, 'WEWEWEW', 1234, 'None', '2025-04-02 02:14:22', 1, 'Available', 0),
(3, 'Albert', 123456, 'Immunization Form', '2025-04-02 02:14:22', 1, 'Available', 0),
(4, 'Surgical', 123, 'Surgical Form', '2025-04-02 02:14:22', 1, 'Available', 0),
(5, 'Addidas', 1234, 'None', '2025-04-02 02:14:22', 1, 'Available', 0),
(6, 'Amor', 1234, 'Immunization Form', '2025-04-02 02:14:22', 1, 'Available', 0);

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `contact_number` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `archived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `supplier_name`, `contact_person`, `contact_number`, `email`, `address`, `created_at`, `created_by`, `updated_by`, `archived`) VALUES
(5, 'Albert', '123', '123', 'albert@gmail.com', 'asd', '2025-04-02 02:14:22', 1, 0, 0),
(6, 'Dogs', '123', '123123', '1234@gmail.com', '123', '2025-04-02 02:14:22', 1, 0, 0),
(7, 'Cat', 'Albert Froilan Impas', '123', 'alfr.impas.swu@phinmaed.com', 'Paknaan Mandaue City Zone(Tamatis)', '2025-04-02 02:14:22', 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `surgical_consent`
--

CREATE TABLE `surgical_consent` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `patient_id` varchar(255) NOT NULL,
  `pet_image` varchar(255) NOT NULL,
  `surgery_date` date NOT NULL,
  `surgical_procedure` varchar(255) NOT NULL,
  `signature` tinyint(4) DEFAULT NULL,
  `date_signed` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `surgical_consent`
--

INSERT INTO `surgical_consent` (`id`, `client_id`, `patient_id`, `pet_image`, `surgery_date`, `surgical_procedure`, `signature`, `date_signed`, `created_at`, `created_by`, `updated_at`) VALUES
(1, 1, '1', 'uploads/1738887471_captured_image.jpg', '2025-02-07', '4', 1, '2025-02-07', '2025-02-07 00:17:51', 0, '2025-02-07 00:17:51');

-- --------------------------------------------------------

--
-- Table structure for table `surgical_notes`
--

CREATE TABLE `surgical_notes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `last_updated` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tax`
--

CREATE TABLE `tax` (
  `id` int(11) NOT NULL,
  `tax_rate` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tax`
--

INSERT INTO `tax` (`id`, `tax_rate`) VALUES
(0, 10);

-- --------------------------------------------------------

--
-- Table structure for table `unit_of_measurement`
--

CREATE TABLE `unit_of_measurement` (
  `id` int(11) NOT NULL,
  `unit_name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) NOT NULL,
  `archived` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unit_of_measurement`
--

INSERT INTO `unit_of_measurement` (`id`, `unit_name`, `created_by`, `created_at`, `updated_by`, `archived`) VALUES
(7, 'ml', 1, '2025-04-02 02:14:22', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `unregistered_clients`
--

CREATE TABLE `unregistered_clients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unregistered_clients`
--

INSERT INTO `unregistered_clients` (`id`, `name`, `created_at`) VALUES
(2, 'albert', '2025-02-13 20:45:52'),
(3, 'albert', '2025-02-13 22:32:28'),
(4, 'impas', '2025-02-13 22:37:02'),
(5, 'impasses', '2025-02-13 22:38:12'),
(6, 'albertimpas', '2025-02-13 22:47:07'),
(7, 'asdasd', '2025-02-13 22:49:00'),
(8, 'asdasd', '2025-02-13 22:53:53'),
(9, 'albert', '2025-02-13 23:34:26'),
(10, 'asd', '2025-02-13 23:34:55'),
(11, '123', '2025-02-13 23:35:56'),
(12, 'Albert', '2025-03-10 13:16:30');

-- --------------------------------------------------------

--
-- Table structure for table `user_logs`
--

CREATE TABLE `user_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_type` enum('login','logout') NOT NULL,
  `event_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_logs`
--

INSERT INTO `user_logs` (`id`, `user_id`, `event_type`, `event_time`) VALUES
(12, 1, 'logout', '2025-02-09 15:07:56'),
(14, 1, 'logout', '2025-02-13 16:12:31'),
(15, 1, 'logout', '2025-02-13 22:04:34'),
(16, 1, 'logout', '2025-02-13 22:25:54'),
(17, 1, 'logout', '2025-02-14 00:12:45'),
(18, 1, 'logout', '2025-03-23 15:34:20'),
(19, 1, 'logout', '2025-03-25 15:25:59'),
(20, 1, 'logout', '2025-03-25 15:28:25');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `clients_FK_1` (`created_by`);

--
-- Indexes for table `generic_cms`
--
ALTER TABLE `generic_cms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `immunization_form`
--
ALTER TABLE `immunization_form`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `immunization_notes`
--
ALTER TABLE `immunization_notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `internal_users`
--
ALTER TABLE `internal_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`) USING HASH;

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_sku` (`sku`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `medications`
--
ALTER TABLE `medications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medications_FK_1` (`patient_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `fk_unregistered_client` (`unregistered_client_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ownerID` (`owner_id`),
  ADD KEY `userID` (`created_by`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `surgical_consent`
--
ALTER TABLE `surgical_consent`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `surgical_notes`
--
ALTER TABLE `surgical_notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `unit_of_measurement`
--
ALTER TABLE `unit_of_measurement`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `unregistered_clients`
--
ALTER TABLE `unregistered_clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_logs`
--
ALTER TABLE `user_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `generic_cms`
--
ALTER TABLE `generic_cms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `immunization_form`
--
ALTER TABLE `immunization_form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `immunization_notes`
--
ALTER TABLE `immunization_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `internal_users`
--
ALTER TABLE `internal_users`
  MODIFY `id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `medications`
--
ALTER TABLE `medications`
  MODIFY `id` int(100) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `surgical_consent`
--
ALTER TABLE `surgical_consent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `surgical_notes`
--
ALTER TABLE `surgical_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `unit_of_measurement`
--
ALTER TABLE `unit_of_measurement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `unregistered_clients`
--
ALTER TABLE `unregistered_clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `user_logs`
--
ALTER TABLE `user_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `medications`
--
ALTER TABLE `medications`
  ADD CONSTRAINT `medications_FK_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_unregistered_client` FOREIGN KEY (`unregistered_client_id`) REFERENCES `unregistered_clients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `ownerID` FOREIGN KEY (`owner_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `userID` FOREIGN KEY (`created_by`) REFERENCES `internal_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_logs`
--
ALTER TABLE `user_logs`
  ADD CONSTRAINT `user_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `internal_users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
