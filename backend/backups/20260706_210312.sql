/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: db    Database: aiumstore
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `accounts_person`
--

DROP TABLE IF EXISTS `accounts_person`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_person` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `level` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `line_id` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `note` longtext NOT NULL,
  `member_level` smallint unsigned DEFAULT NULL,
  `points` int unsigned DEFAULT NULL,
  `total_spent` decimal(12,2) DEFAULT NULL,
  `employer_brand_id` bigint DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `accounts_person_employer_brand_id_35821675_fk_products_brand_id` (`employer_brand_id`),
  KEY `accounts_person_manager_id_aa2b1dec_fk_accounts_person_id` (`manager_id`),
  CONSTRAINT `accounts_person_employer_brand_id_35821675_fk_products_brand_id` FOREIGN KEY (`employer_brand_id`) REFERENCES `products_brand` (`id`),
  CONSTRAINT `accounts_person_manager_id_aa2b1dec_fk_accounts_person_id` FOREIGN KEY (`manager_id`) REFERENCES `accounts_person` (`id`),
  CONSTRAINT `accounts_person_chk_1` CHECK ((`member_level` >= 0)),
  CONSTRAINT `accounts_person_chk_2` CHECK ((`points` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_person`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `accounts_person` WRITE;
/*!40000 ALTER TABLE `accounts_person` DISABLE KEYS */;
INSERT INTO `accounts_person` VALUES
(1,'pbkdf2_sha256$720000$NyEveUshadwqHitfbRJUg0$f8b+acI65GZP7TLjD5z3esM2uJXP+Xyyb/HCl+8Taqk=',NULL,1,'jerryx0222','','','jerryx0222@gmail.com',1,1,'2026-07-06 04:18:38.953989','superuser','','','','','','',1,0,0.00,NULL,NULL),
(8,'pbkdf2_sha256$720000$enlmt6vmD2c5hApQsAQZMG$Ke+FQthDkE0YarRuhanu+fAfoeQlHe3v6jIqIG6yRsM=',NULL,0,'j50','','','',0,1,'2026-07-06 07:55:25.366973','brand_owner','王五十','','','','','',NULL,NULL,NULL,NULL,NULL),
(9,'pbkdf2_sha256$720000$rICVz9AodzJgHBBnFTighU$PIIglyNkhjYW9D1ipwkR51/Sglg4CDtbVn9QHfdME1M=',NULL,0,'wutea','','','',0,1,'2026-07-06 07:56:15.786772','brand_owner','吳紅茶','','','','','',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `accounts_person` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `accounts_person_favorite_products`
--

DROP TABLE IF EXISTS `accounts_person_favorite_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_person_favorite_products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `person_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_person_favorite_person_id_product_id_643092c5_uniq` (`person_id`,`product_id`),
  KEY `accounts_person_favo_product_id_d791a33a_fk_products_` (`product_id`),
  CONSTRAINT `accounts_person_favo_person_id_49e86ac5_fk_accounts_` FOREIGN KEY (`person_id`) REFERENCES `accounts_person` (`id`),
  CONSTRAINT `accounts_person_favo_product_id_d791a33a_fk_products_` FOREIGN KEY (`product_id`) REFERENCES `products_product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_person_favorite_products`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `accounts_person_favorite_products` WRITE;
/*!40000 ALTER TABLE `accounts_person_favorite_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts_person_favorite_products` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `accounts_person_franchised_brands`
--

DROP TABLE IF EXISTS `accounts_person_franchised_brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_person_franchised_brands` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `person_id` bigint NOT NULL,
  `brand_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_person_franchis_person_id_brand_id_920c47c8_uniq` (`person_id`,`brand_id`),
  KEY `accounts_person_fran_brand_id_1149c58b_fk_products_` (`brand_id`),
  CONSTRAINT `accounts_person_fran_brand_id_1149c58b_fk_products_` FOREIGN KEY (`brand_id`) REFERENCES `products_brand` (`id`),
  CONSTRAINT `accounts_person_fran_person_id_58d1cfbb_fk_accounts_` FOREIGN KEY (`person_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_person_franchised_brands`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `accounts_person_franchised_brands` WRITE;
/*!40000 ALTER TABLE `accounts_person_franchised_brands` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts_person_franchised_brands` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `accounts_person_groups`
--

DROP TABLE IF EXISTS `accounts_person_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_person_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `person_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_person_groups_person_id_group_id_92ec326f_uniq` (`person_id`,`group_id`),
  KEY `accounts_person_groups_group_id_2455a92a_fk_auth_group_id` (`group_id`),
  CONSTRAINT `accounts_person_groups_group_id_2455a92a_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `accounts_person_groups_person_id_0267a8e2_fk_accounts_person_id` FOREIGN KEY (`person_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_person_groups`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `accounts_person_groups` WRITE;
/*!40000 ALTER TABLE `accounts_person_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts_person_groups` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `accounts_person_user_permissions`
--

DROP TABLE IF EXISTS `accounts_person_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_person_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `person_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_person_user_per_person_id_permission_id_d2e37e5b_uniq` (`person_id`,`permission_id`),
  KEY `accounts_person_user_permission_id_ef54d0fe_fk_auth_perm` (`permission_id`),
  CONSTRAINT `accounts_person_user_permission_id_ef54d0fe_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `accounts_person_user_person_id_f01807a9_fk_accounts_` FOREIGN KEY (`person_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_person_user_permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `accounts_person_user_permissions` WRITE;
/*!40000 ALTER TABLE `accounts_person_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts_person_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES
(1,'Can add log entry',1,'add_logentry'),
(2,'Can change log entry',1,'change_logentry'),
(3,'Can delete log entry',1,'delete_logentry'),
(4,'Can view log entry',1,'view_logentry'),
(5,'Can add permission',2,'add_permission'),
(6,'Can change permission',2,'change_permission'),
(7,'Can delete permission',2,'delete_permission'),
(8,'Can view permission',2,'view_permission'),
(9,'Can add group',3,'add_group'),
(10,'Can change group',3,'change_group'),
(11,'Can delete group',3,'delete_group'),
(12,'Can view group',3,'view_group'),
(13,'Can add content type',4,'add_contenttype'),
(14,'Can change content type',4,'change_contenttype'),
(15,'Can delete content type',4,'delete_contenttype'),
(16,'Can view content type',4,'view_contenttype'),
(17,'Can add session',5,'add_session'),
(18,'Can change session',5,'change_session'),
(19,'Can delete session',5,'delete_session'),
(20,'Can view session',5,'view_session'),
(21,'Can add blacklisted token',6,'add_blacklistedtoken'),
(22,'Can change blacklisted token',6,'change_blacklistedtoken'),
(23,'Can delete blacklisted token',6,'delete_blacklistedtoken'),
(24,'Can view blacklisted token',6,'view_blacklistedtoken'),
(25,'Can add outstanding token',7,'add_outstandingtoken'),
(26,'Can change outstanding token',7,'change_outstandingtoken'),
(27,'Can delete outstanding token',7,'delete_outstandingtoken'),
(28,'Can view outstanding token',7,'view_outstandingtoken'),
(29,'Can add 人員',8,'add_person'),
(30,'Can change 人員',8,'change_person'),
(31,'Can delete 人員',8,'delete_person'),
(32,'Can view 人員',8,'view_person'),
(33,'Can add 產品種類',9,'add_category'),
(34,'Can change 產品種類',9,'change_category'),
(35,'Can delete 產品種類',9,'delete_category'),
(36,'Can view 產品種類',9,'view_category'),
(37,'Can add 品牌',10,'add_brand'),
(38,'Can change 品牌',10,'change_brand'),
(39,'Can delete 品牌',10,'delete_brand'),
(40,'Can view 品牌',10,'view_brand'),
(41,'Can add 產品',11,'add_product'),
(42,'Can change 產品',11,'change_product'),
(43,'Can delete 產品',11,'delete_product'),
(44,'Can view 產品',11,'view_product'),
(45,'Can add 產品圖',12,'add_productimage'),
(46,'Can change 產品圖',12,'change_productimage'),
(47,'Can delete 產品圖',12,'delete_productimage'),
(48,'Can view 產品圖',12,'view_productimage'),
(49,'Can add 門市商品上架',13,'add_storeproductlisting'),
(50,'Can change 門市商品上架',13,'change_storeproductlisting'),
(51,'Can delete 門市商品上架',13,'delete_storeproductlisting'),
(52,'Can view 門市商品上架',13,'view_storeproductlisting'),
(53,'Can add 購物車',14,'add_cart'),
(54,'Can change 購物車',14,'change_cart'),
(55,'Can delete 購物車',14,'delete_cart'),
(56,'Can view 購物車',14,'view_cart'),
(57,'Can add 購物車項目',15,'add_cartitem'),
(58,'Can change 購物車項目',15,'change_cartitem'),
(59,'Can delete 購物車項目',15,'delete_cartitem'),
(60,'Can view 購物車項目',15,'view_cartitem'),
(61,'Can add 訂單',16,'add_order'),
(62,'Can change 訂單',16,'change_order'),
(63,'Can delete 訂單',16,'delete_order'),
(64,'Can view 訂單',16,'view_order'),
(65,'Can add 訂單項目',17,'add_orderitem'),
(66,'Can change 訂單項目',17,'change_orderitem'),
(67,'Can delete 訂單項目',17,'delete_orderitem'),
(68,'Can view 訂單項目',17,'view_orderitem'),
(69,'Can add 付款紀錄',18,'add_payment'),
(70,'Can change 付款紀錄',18,'change_payment'),
(71,'Can delete 付款紀錄',18,'delete_payment'),
(72,'Can view 付款紀錄',18,'view_payment');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `cart_cart`
--

DROP TABLE IF EXISTS `cart_cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_cart` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `cart_cart_user_id_9b4220b9_fk_accounts_person_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_cart`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `cart_cart` WRITE;
/*!40000 ALTER TABLE `cart_cart` DISABLE KEYS */;
INSERT INTO `cart_cart` VALUES
(1,'2026-07-06 06:05:44.384118','2026-07-06 06:05:44.384155',1);
/*!40000 ALTER TABLE `cart_cart` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `cart_cartitem`
--

DROP TABLE IF EXISTS `cart_cartitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_cartitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantity` int unsigned NOT NULL,
  `cart_id` bigint NOT NULL,
  `listing_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_cartitem_cart_id_listing_id_3b7cae8f_uniq` (`cart_id`,`listing_id`),
  KEY `cart_cartitem_listing_id_7dbdaf35_fk_products_` (`listing_id`),
  CONSTRAINT `cart_cartitem_cart_id_370ad265_fk_cart_cart_id` FOREIGN KEY (`cart_id`) REFERENCES `cart_cart` (`id`),
  CONSTRAINT `cart_cartitem_listing_id_7dbdaf35_fk_products_` FOREIGN KEY (`listing_id`) REFERENCES `products_storeproductlisting` (`id`),
  CONSTRAINT `cart_cartitem_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_cartitem`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `cart_cartitem` WRITE;
/*!40000 ALTER TABLE `cart_cartitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_cartitem` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_accounts_person_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_accounts_person_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_person` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES
(8,'accounts','person'),
(1,'admin','logentry'),
(3,'auth','group'),
(2,'auth','permission'),
(14,'cart','cart'),
(15,'cart','cartitem'),
(4,'contenttypes','contenttype'),
(16,'orders','order'),
(17,'orders','orderitem'),
(18,'orders','payment'),
(10,'products','brand'),
(9,'products','category'),
(11,'products','product'),
(12,'products','productimage'),
(13,'products','storeproductlisting'),
(5,'sessions','session'),
(6,'token_blacklist','blacklistedtoken'),
(7,'token_blacklist','outstandingtoken');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES
(1,'accounts','0001_initial','2026-07-06 03:52:58.584643'),
(2,'products','0001_initial','2026-07-06 03:53:00.628940'),
(3,'products','0002_alter_brand_owner','2026-07-06 03:53:00.957715'),
(4,'contenttypes','0001_initial','2026-07-06 03:53:01.052432'),
(5,'contenttypes','0002_remove_content_type_name','2026-07-06 03:53:01.255164'),
(6,'auth','0001_initial','2026-07-06 03:53:01.972857'),
(7,'auth','0002_alter_permission_name_max_length','2026-07-06 03:53:02.124420'),
(8,'auth','0003_alter_user_email_max_length','2026-07-06 03:53:02.135228'),
(9,'auth','0004_alter_user_username_opts','2026-07-06 03:53:02.145224'),
(10,'auth','0005_alter_user_last_login_null','2026-07-06 03:53:02.156179'),
(11,'auth','0006_require_contenttypes_0002','2026-07-06 03:53:02.163046'),
(12,'auth','0007_alter_validators_add_error_messages','2026-07-06 03:53:02.173523'),
(13,'auth','0008_alter_user_username_max_length','2026-07-06 03:53:02.185449'),
(14,'auth','0009_alter_user_last_name_max_length','2026-07-06 03:53:02.195868'),
(15,'auth','0010_alter_group_name_max_length','2026-07-06 03:53:02.222160'),
(16,'auth','0011_update_proxy_permissions','2026-07-06 03:53:02.237873'),
(17,'auth','0012_alter_user_first_name_max_length','2026-07-06 03:53:02.249118'),
(18,'accounts','0002_initial','2026-07-06 03:53:03.907329'),
(19,'accounts','0003_person_franchised_brands_person_manager_and_more','2026-07-06 03:53:04.541310'),
(20,'admin','0001_initial','2026-07-06 03:53:04.900690'),
(21,'admin','0002_logentry_remove_auto_add','2026-07-06 03:53:04.916378'),
(22,'admin','0003_logentry_add_action_flag_choices','2026-07-06 03:53:04.932439'),
(23,'cart','0001_initial','2026-07-06 03:53:05.467111'),
(24,'orders','0001_initial','2026-07-06 03:53:06.217844'),
(25,'products','0003_storeproductlisting_actual_price','2026-07-06 03:53:06.343354'),
(26,'sessions','0001_initial','2026-07-06 03:53:06.436825'),
(27,'token_blacklist','0001_initial','2026-07-06 03:53:06.854194'),
(28,'token_blacklist','0002_outstandingtoken_jti_hex','2026-07-06 03:53:06.970332'),
(29,'token_blacklist','0003_auto_20171017_2007','2026-07-06 03:53:06.994615'),
(30,'token_blacklist','0004_auto_20171017_2013','2026-07-06 03:53:07.154984'),
(31,'token_blacklist','0005_remove_outstandingtoken_jti','2026-07-06 03:53:07.265533'),
(32,'token_blacklist','0006_auto_20171017_2113','2026-07-06 03:53:07.311213'),
(33,'token_blacklist','0007_auto_20171017_2214','2026-07-06 03:53:07.691853'),
(34,'token_blacklist','0008_migrate_to_bigautofield','2026-07-06 03:53:08.242978'),
(35,'token_blacklist','0010_fix_migrate_to_bigautofield','2026-07-06 03:53:08.270652'),
(36,'token_blacklist','0011_linearizes_history','2026-07-06 03:53:08.277771'),
(37,'token_blacklist','0012_alter_outstandingtoken_user','2026-07-06 03:53:08.299972');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `orders_order`
--

DROP TABLE IF EXISTS `orders_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  `shipping_address` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_order_user_id_e9b59eb1_fk_accounts_person_id` (`user_id`),
  CONSTRAINT `orders_order_user_id_e9b59eb1_fk_accounts_person_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders_order`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `orders_order` WRITE;
/*!40000 ALTER TABLE `orders_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders_order` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `orders_orderitem`
--

DROP TABLE IF EXISTS `orders_orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders_orderitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_name` varchar(150) NOT NULL,
  `store_name` varchar(150) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `listing_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_orderitem_listing_id_bf2cb9e3_fk_products_` (`listing_id`),
  KEY `orders_orderitem_order_id_fe61a34d_fk_orders_order_id` (`order_id`),
  CONSTRAINT `orders_orderitem_listing_id_bf2cb9e3_fk_products_` FOREIGN KEY (`listing_id`) REFERENCES `products_storeproductlisting` (`id`),
  CONSTRAINT `orders_orderitem_order_id_fe61a34d_fk_orders_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders_order` (`id`),
  CONSTRAINT `orders_orderitem_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders_orderitem`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `orders_orderitem` WRITE;
/*!40000 ALTER TABLE `orders_orderitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders_orderitem` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `orders_payment`
--

DROP TABLE IF EXISTS `orders_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders_payment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `method` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `transaction_id` varchar(128) NOT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `order_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  CONSTRAINT `orders_payment_order_id_bdccf250_fk_orders_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders_order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders_payment`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `orders_payment` WRITE;
/*!40000 ALTER TABLE `orders_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders_payment` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products_brand`
--

DROP TABLE IF EXISTS `products_brand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_brand` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `brand_type` varchar(20) NOT NULL,
  `name_en` varchar(150) NOT NULL,
  `name_zh` varchar(150) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `website` varchar(200) NOT NULL,
  `note` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `contact_id` bigint DEFAULT NULL,
  `owner_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_brand_owner_id_e065bf86_uniq` (`owner_id`),
  KEY `products_brand_contact_id_c0fd886e_fk_accounts_person_id` (`contact_id`),
  CONSTRAINT `products_brand_contact_id_c0fd886e_fk_accounts_person_id` FOREIGN KEY (`contact_id`) REFERENCES `accounts_person` (`id`),
  CONSTRAINT `products_brand_owner_id_e065bf86_fk_accounts_person_id` FOREIGN KEY (`owner_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_brand`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products_brand` WRITE;
/*!40000 ALTER TABLE `products_brand` DISABLE KEYS */;
INSERT INTO `products_brand` VALUES
(3,'product_brand','','50嵐-中區','brands/images.png','','雅嵐股份有限公司','2026-07-06 06:25:23.885325',NULL,8),
(5,'product_brand','','吳家紅茶冰','brands/images_2_1cBnmXy.jpg','https://www.wujiatea.com.tw','','2026-07-06 06:32:58.723415',NULL,9);
/*!40000 ALTER TABLE `products_brand` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products_brand_carried_product_brands`
--

DROP TABLE IF EXISTS `products_brand_carried_product_brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_brand_carried_product_brands` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `from_brand_id` bigint NOT NULL,
  `to_brand_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_brand_carried_p_from_brand_id_to_brand_i_2b6d1898_uniq` (`from_brand_id`,`to_brand_id`),
  KEY `products_brand_carri_to_brand_id_d993708a_fk_products_` (`to_brand_id`),
  CONSTRAINT `products_brand_carri_from_brand_id_96e641a7_fk_products_` FOREIGN KEY (`from_brand_id`) REFERENCES `products_brand` (`id`),
  CONSTRAINT `products_brand_carri_to_brand_id_d993708a_fk_products_` FOREIGN KEY (`to_brand_id`) REFERENCES `products_brand` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_brand_carried_product_brands`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products_brand_carried_product_brands` WRITE;
/*!40000 ALTER TABLE `products_brand_carried_product_brands` DISABLE KEYS */;
/*!40000 ALTER TABLE `products_brand_carried_product_brands` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products_category`
--

DROP TABLE IF EXISTS `products_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `sub_category_1` varchar(50) NOT NULL,
  `sub_category_2` varchar(50) NOT NULL,
  `sub_category_3` varchar(50) NOT NULL,
  `sub_category_4` varchar(50) NOT NULL,
  `sub_category_5` varchar(50) NOT NULL,
  `description` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_category`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products_category` WRITE;
/*!40000 ALTER TABLE `products_category` DISABLE KEYS */;
INSERT INTO `products_category` VALUES
(3,'找好茶','找好茶','','','','','','','2026-07-06 11:20:17.106637'),
(4,'找奶茶(奶精)','找奶茶奶精','','','','','','','2026-07-06 11:20:43.656637'),
(5,'綠茶類','綠茶類','','','','','','','2026-07-06 11:24:27.992711'),
(6,'紅茶類','紅茶類','','','','','','','2026-07-06 11:24:42.786782');
/*!40000 ALTER TABLE `products_category` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products_product`
--

DROP TABLE IF EXISTS `products_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_product` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `spec` varchar(100) NOT NULL,
  `process` longtext NOT NULL,
  `suggested_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `category_id` bigint NOT NULL,
  `product_brand_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `products_product_category_id_9b594869_fk_products_category_id` (`category_id`),
  KEY `products_product_product_brand_id_1d698d6e_fk_products_brand_id` (`product_brand_id`),
  CONSTRAINT `products_product_category_id_9b594869_fk_products_category_id` FOREIGN KEY (`category_id`) REFERENCES `products_category` (`id`),
  CONSTRAINT `products_product_product_brand_id_1d698d6e_fk_products_brand_id` FOREIGN KEY (`product_brand_id`) REFERENCES `products_brand` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_product`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products_product` WRITE;
/*!40000 ALTER TABLE `products_product` DISABLE KEYS */;
INSERT INTO `products_product` VALUES
(1,'苿莉綠茶','1','M','',25.00,25.00,'2026-07-06 11:21:17.563372','2026-07-06 11:21:17.563393',3,3),
(2,'苿莉綠茶','2','L','',30.00,30.00,'2026-07-06 11:21:31.176653','2026-07-06 11:21:31.176676',3,3),
(3,'奶茶','3','M','',40.00,40.00,'2026-07-06 11:22:07.692920','2026-07-06 11:22:07.692946',4,3),
(4,'奶茶','4','L','',55.00,55.00,'2026-07-06 11:22:14.390587','2026-07-06 11:22:14.390611',4,3),
(5,'金萱綠茶','5','L','',25.00,25.00,'2026-07-06 11:26:04.004224','2026-07-06 11:26:04.004265',5,5),
(6,'金萱綠茶','6','XL','',30.00,30.00,'2026-07-06 11:26:19.284690','2026-07-06 11:26:19.284725',5,5),
(7,'吳家紅茶','7','L','',25.00,25.00,'2026-07-06 11:26:43.528574','2026-07-06 11:26:43.528625',6,5),
(8,'吳家紅茶','8','XL','',30.00,30.00,'2026-07-06 11:26:57.914660','2026-07-06 11:26:57.914757',6,5);
/*!40000 ALTER TABLE `products_product` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products_productimage`
--

DROP TABLE IF EXISTS `products_productimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_productimage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image` varchar(100) NOT NULL,
  `sort_order` int unsigned NOT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `products_productimage_product_id_e747596a_fk_products_product_id` (`product_id`),
  CONSTRAINT `products_productimage_product_id_e747596a_fk_products_product_id` FOREIGN KEY (`product_id`) REFERENCES `products_product` (`id`),
  CONSTRAINT `products_productimage_chk_1` CHECK ((`sort_order` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_productimage`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products_productimage` WRITE;
/*!40000 ALTER TABLE `products_productimage` DISABLE KEYS */;
INSERT INTO `products_productimage` VALUES
(1,'products/wered.jpg',0,7),
(2,'products/wered_Ki1pEpz.jpg',0,8);
/*!40000 ALTER TABLE `products_productimage` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products_storeproductlisting`
--

DROP TABLE IF EXISTS `products_storeproductlisting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_storeproductlisting` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stock` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `franchise_brand_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `actual_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_storeproductlis_franchise_brand_id_produ_5de93998_uniq` (`franchise_brand_id`,`product_id`),
  KEY `products_storeproduc_product_id_fcaf9aac_fk_products_` (`product_id`),
  CONSTRAINT `products_storeproduc_franchise_brand_id_69062b8b_fk_products_` FOREIGN KEY (`franchise_brand_id`) REFERENCES `products_brand` (`id`),
  CONSTRAINT `products_storeproduc_product_id_fcaf9aac_fk_products_` FOREIGN KEY (`product_id`) REFERENCES `products_product` (`id`),
  CONSTRAINT `products_storeproductlisting_chk_1` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_storeproductlisting`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products_storeproductlisting` WRITE;
/*!40000 ALTER TABLE `products_storeproductlisting` DISABLE KEYS */;
/*!40000 ALTER TABLE `products_storeproductlisting` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `token_blacklist_blacklistedtoken`
--

DROP TABLE IF EXISTS `token_blacklist_blacklistedtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_blacklistedtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blacklisted_at` datetime(6) NOT NULL,
  `token_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`),
  CONSTRAINT `token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk` FOREIGN KEY (`token_id`) REFERENCES `token_blacklist_outstandingtoken` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_blacklistedtoken`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `token_blacklist_blacklistedtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_blacklistedtoken` VALUES
(1,'2026-07-06 05:13:23.501213',1),
(3,'2026-07-06 06:26:16.044737',6),
(4,'2026-07-06 07:15:11.189125',8),
(6,'2026-07-06 07:56:42.851079',19),
(7,'2026-07-06 08:39:29.266427',20),
(8,'2026-07-06 11:11:26.109310',24);
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `token_blacklist_outstandingtoken`
--

DROP TABLE IF EXISTS `token_blacklist_outstandingtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_outstandingtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` longtext NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `jti` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq` (`jti`),
  KEY `token_blacklist_outs_user_id_83bc629a_fk_accounts_` (`user_id`),
  CONSTRAINT `token_blacklist_outs_user_id_83bc629a_fk_accounts_` FOREIGN KEY (`user_id`) REFERENCES `accounts_person` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_outstandingtoken`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `token_blacklist_outstandingtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_outstandingtoken` VALUES
(1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkxNjQ0NSwiaWF0IjoxNzgzMzExNjQ1LCJqdGkiOiIwNGNmZDMyNzZiMjE0ZDExOGU3YzI3MzRhMWMxOTUxZCIsInVzZXJfaWQiOjF9.QYSi7ipX-HIEMimS6f6mitzru-FSnSBjh8RF4H6WB4o','2026-07-06 04:20:45.986312','2026-07-13 04:20:45.000000',1,'04cfd3276b214d118e7c2734a1c1951d'),
(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMTU1MiwiaWF0IjoxNzgzMzE2NzUyLCJqdGkiOiI0ODNiZWFiMWUwNWY0MGVhOTkxNzAwZjU3YWU5NzQzYSIsInVzZXJfaWQiOjF9.As4qTVC63a1lM9pSo7iRtADtTViudoWXaM37LyRurEw','2026-07-06 05:45:52.351949','2026-07-13 05:45:52.000000',1,'483beab1e05f40ea991700f57ae9743a'),
(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMTU5NywiaWF0IjoxNzgzMzE2Nzk3LCJqdGkiOiIzY2YxZTk4MDJhNzQ0ZDQ1YmMyMzQ4MDA2MmUzYmVmNCIsInVzZXJfaWQiOjF9.3E3iiOPQE5CX2RSBOnW5VIjCX0Evhuuc8K4AfUgfdu4','2026-07-06 05:46:37.670649','2026-07-13 05:46:37.000000',1,'3cf1e9802a744d45bc23480062e3bef4'),
(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMTcwNCwiaWF0IjoxNzgzMzE2OTA0LCJqdGkiOiI2NTQxMDYwZThmMTk0NzA4ODlhOTJkODZiZmI1ODk0MiIsInVzZXJfaWQiOjF9.C9gHnKVJhpX_1TICKHNn2oUkFyOzkgUeUZB1PHvcN_U','2026-07-06 05:48:24.461416','2026-07-13 05:48:24.000000',1,'6541060e8f19470889a92d86bfb58942'),
(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMTc3MCwiaWF0IjoxNzgzMzE2OTcwLCJqdGkiOiJiZTllYjA4ZTcxMzA0ZGI2YWJiNzIzYTM0Mjg3YjcxYyIsInVzZXJfaWQiOjF9.wwORxhJUKUaxBVa0cyN_oFw-MM0ONyAeNuVMbwSiDSM','2026-07-06 05:49:30.824612','2026-07-13 05:49:30.000000',1,'be9eb08e71304db6abb723a34287b71c'),
(6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMjczNiwiaWF0IjoxNzgzMzE3OTM2LCJqdGkiOiI4YTIzMTdkYTQxMWM0MGQyYjMyY2Y0ZDIzMjJjNDdiMiIsInVzZXJfaWQiOjF9.ooWkdkz1R-M4nzjr1md-HtwUk6ySBZDN_7wtaM75Q0U','2026-07-06 06:05:36.679134','2026-07-13 06:05:36.000000',1,'8a2317da411c40d2b32cf4d2322c47b2'),
(7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMzQxNiwiaWF0IjoxNzgzMzE4NjE2LCJqdGkiOiI2YzUxNzg1MTc0Mjc0NGFiYWM5ZDlhMTQ2OTI0NDRlNiIsInVzZXJfaWQiOjF9.TjjCVCXW0GLOZEkbOHQ4JfOtopHvPyq_gw_IkuqzsRY','2026-07-06 06:16:56.333348','2026-07-13 06:16:56.000000',1,'6c517851742744abac9d9a14692444e6'),
(8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyMzk4NiwiaWF0IjoxNzgzMzE5MTg2LCJqdGkiOiJlNWQyYzNkOTFhMzU0M2IwODYzYzMxNTBiNGFiZTJiNyIsInVzZXJfaWQiOjF9.9GJb5aIFnmh108q9m8IQXJrePjJbQ3Rr8zK1-E_9Lxw','2026-07-06 06:26:26.231357','2026-07-13 06:26:26.000000',1,'e5d2c3d91a3543b0863c3150b4abe2b7'),
(9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNDAzOSwiaWF0IjoxNzgzMzE5MjM5LCJqdGkiOiI0M2IwODgyYTJjNTk0ZWEzOWE5ZTdiZTIxM2JlNjQ3NCIsInVzZXJfaWQiOjF9.0wgwJjjq9r9T25gV5bQ1GuTPeSUl2MzvTPMBtWeN4EU','2026-07-06 06:27:19.076482','2026-07-13 06:27:19.000000',1,'43b0882a2c594ea39a9e7be213be6474'),
(10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNDA4OSwiaWF0IjoxNzgzMzE5Mjg5LCJqdGkiOiIzMmZkYjNhZTJhNjQ0ZTc4YmEwMTAzYjk0NTUxNjFjMiIsInVzZXJfaWQiOjF9.hUTly4qnMjlWv10Y2B3VUmHoOfTRSMP3Tziy2VsPBqA','2026-07-06 06:28:09.685090','2026-07-13 06:28:09.000000',1,'32fdb3ae2a644e78ba0103b9455161c2'),
(11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNDQyNCwiaWF0IjoxNzgzMzE5NjI0LCJqdGkiOiIyYTY4ZjAwNmZhNTQ0NmFiODQ5YjFkZDQ1ODI5Zjg2ZCIsInVzZXJfaWQiOjF9.YgksciZQ51M9iyuZ-LuiIe_gjK2es6VThNEdrKHx59s','2026-07-06 06:33:44.389053','2026-07-13 06:33:44.000000',1,'2a68f006fa5446ab849b1dd45829f86d'),
(12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNDcwNywiaWF0IjoxNzgzMzE5OTA3LCJqdGkiOiI3NTExNDBkNTAyMmQ0NTU4YTY3OWU0NWM5ZjU5NzA3ZSIsInVzZXJfaWQiOjF9.8NiHXVxXu7CcKdQla0d8M94QkSJL3hcMRFrEnPfW95w','2026-07-06 06:38:27.664770','2026-07-13 06:38:27.000000',1,'751140d5022d4558a679e45c9f59707e'),
(13,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNzQ2MSwiaWF0IjoxNzgzMzIyNjYxLCJqdGkiOiJjNTc0ZTU4OTFkNTU0YzcwYmNhMjVlYWQ1ZDBiZGRkNiIsInVzZXJfaWQiOjF9.y0yHooxpzMcw3Q7be-qUInzDnLra0StzkJhQ_pradZQ','2026-07-06 07:24:21.878524','2026-07-13 07:24:21.000000',1,'c574e5891d554c70bca25ead5d0bddd6'),
(14,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNzQ2MiwiaWF0IjoxNzgzMzIyNjYyLCJqdGkiOiI0NzQyNDI1MThkZjI0OTg1ODVkODY3ZDhkOWJiZTZkZCIsInVzZXJfaWQiOjN9.sbK4JlUMceAWH8Tv2edkdlATMZqD5UIe6ylygMWAphE','2026-07-06 07:24:22.731206','2026-07-13 07:24:22.000000',NULL,'474242518df2498585d867d8d9bbe6dd'),
(15,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNzUzOCwiaWF0IjoxNzgzMzIyNzM4LCJqdGkiOiI3ODU5M2E2MDkwZDU0NDJkYjM3ZDc5NmU3NTgwZDI3ZCIsInVzZXJfaWQiOjF9.9V3gZggFGWM2xDSzkhEKB6nzs9mKwkc7X8QYYJD7WsA','2026-07-06 07:25:38.628050','2026-07-13 07:25:38.000000',1,'78593a6090d5442db37d796e7580d27d'),
(16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyNzYxMSwiaWF0IjoxNzgzMzIyODExLCJqdGkiOiJkZjBlOWI1ZWI5NGQ0NzhkYTkxYTMxZWQ4NDAzYTcyOCIsInVzZXJfaWQiOjF9.-sBsJVp1aG1pv088eH15CAi7qtmzlV0MUtpx-ZSb8bg','2026-07-06 07:26:51.133923','2026-07-13 07:26:51.000000',1,'df0e9b5eb94d478da91a31ed8403a728'),
(17,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyODg0MSwiaWF0IjoxNzgzMzI0MDQxLCJqdGkiOiI5MDkwNGZlN2IzZjc0NzlmOWU1ZGZlNGQ5M2JiYzZjZSIsInVzZXJfaWQiOjF9.BPIXnlIi6NHuCPzMvcXNwAX1l-jTZT_rNocthC7ILsQ','2026-07-06 07:47:21.644690','2026-07-13 07:47:21.000000',1,'90904fe7b3f7479f9e5dfe4d93bbc6ce'),
(18,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyODg0MywiaWF0IjoxNzgzMzI0MDQzLCJqdGkiOiJmODc0N2FiMDUxYWU0N2YxODI1OWI2ZWViODQxOGJkOCIsInVzZXJfaWQiOjd9.UDFGjaOi8-6sqnao5tegui6GkaEilJ9kecWApcJue88','2026-07-06 07:47:23.002451','2026-07-13 07:47:23.000000',NULL,'f8747ab051ae47f18259b6eeb8418bd8'),
(19,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyOTIzNiwiaWF0IjoxNzgzMzI0NDM2LCJqdGkiOiI2N2FiYmFkZDM2ZDc0YTcwOTUyODI4ZWM1NjI4ZWI5OSIsInVzZXJfaWQiOjF9.8rLDYfXi-zTlBrP_kQfv-HsdaYidLaUGXL2_Cc3XFYU','2026-07-06 07:53:56.044069','2026-07-13 07:53:56.000000',1,'67abbadd36d74a70952828ec5628eb99'),
(20,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkyOTQxNCwiaWF0IjoxNzgzMzI0NjE0LCJqdGkiOiIyZGRkMTZlZmU5Nzc0MjIxODljZDY2YmE4ZTI4NjRjZCIsInVzZXJfaWQiOjF9.XsbpaYzRAjSvHKy3YNsLcroztNZa2xwgdaYb2wrF7j4','2026-07-06 07:56:54.121496','2026-07-13 07:56:54.000000',1,'2ddd16efe977422189cd66ba8e2864cd'),
(21,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkzMTQ2NiwiaWF0IjoxNzgzMzI2NjY2LCJqdGkiOiIxM2E3YTRmYWE1OWM0N2Y2YmI5YzdjZjQwZjM5ZTljMiIsInVzZXJfaWQiOjF9.bnGuu7r3qcOo7eIaS87BO3SwF3If7R8Vk4l3NehH_BA','2026-07-06 08:31:06.634487','2026-07-13 08:31:06.000000',1,'13a7a4faa59c47f6bb9c7cf40f39e9c2'),
(22,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkzMTU2NywiaWF0IjoxNzgzMzI2NzY3LCJqdGkiOiIyMzllODc4YjJjOGU0MGU3YTBiMmFiNTJiMTZhNmYzOCIsInVzZXJfaWQiOjF9.skLXQSJcmtkgPnbSAjGht2-1ahNBxzruSc-7kybsjuE','2026-07-06 08:32:47.127693','2026-07-13 08:32:47.000000',1,'239e878b2c8e40e7a0b2ab52b16a6f38'),
(23,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzkzMTk4MCwiaWF0IjoxNzgzMzI3MTgwLCJqdGkiOiJhNTY2NDU0OGViNDg0NGEzYTlhNTIzYTI4MDBhZjI1ZiIsInVzZXJfaWQiOjF9.Qo657xWKUSKhavyAF_172r56nGNfsuzhWN_CBaezG-U','2026-07-06 08:39:40.960986','2026-07-13 08:39:40.000000',1,'a5664548eb4844a3a9a523a2800af25f'),
(24,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzYwMTU1NSwiaWF0IjoxNzgyOTk2NzU1LCJqdGkiOiJiN2EyNmNhZDRkYWM0NzhkYjhkZDRiYjY0ZGRhZmIwNiIsInVzZXJfaWQiOjd9.3G4-m4aOvfjGnXZfgJRNwUbgXaRuKFrzjUTClvojkS8',NULL,'2026-07-09 12:52:35.000000',NULL,'b7a26cad4dac478db8dd4bb64ddafb06'),
(30,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4Mzk0MTExMCwiaWF0IjoxNzgzMzM2MzEwLCJqdGkiOiIwMzI4OTY5ZTQxNmE0YmJhYmVmMTY2Nzg1MGI1MmEyYiIsInVzZXJfaWQiOjF9.t2x3wufEb7jnu01Xcmtpc5TUiTK4IDrha0FMZO3iXQQ','2026-07-06 11:11:50.394029','2026-07-13 11:11:50.000000',1,'0328969e416a4bbabef1667850b52a2b');
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Dumping routines for database 'aiumstore'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-07-06 21:03:13
