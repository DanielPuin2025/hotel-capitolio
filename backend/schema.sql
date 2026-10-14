CREATE DATABASE IF NOT EXISTS hotel_capitolio;
USE hotel_capitolio;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('Administrador','Recepcionista') NOT NULL,
  estado ENUM('Activo','Inactivo') DEFAULT 'Activo'
);

CREATE TABLE habitaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(10) UNIQUE NOT NULL,
  tipo ENUM('Sencilla','Doble','Triple','Suite') NOT NULL,
  tarifa DECIMAL(10,2) NOT NULL,
  capacidad INT NOT NULL,
  estado ENUM('Disponible','Ocupada','En Limpieza','Mantenimiento') DEFAULT 'Disponible'
);

CREATE TABLE huespedes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(30) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(100),
  procedencia VARCHAR(100)
);

CREATE TABLE reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  huesped_id INT NOT NULL,
  habitacion_id INT NOT NULL,
  fecha_entrada DATE NOT NULL,
  fecha_salida DATE NOT NULL,
  estado ENUM('Pendiente','Confirmada','Cancelada') DEFAULT 'Pendiente',
  FOREIGN KEY (huesped_id) REFERENCES huespedes(id),
  FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id)
);

CREATE TABLE checkin_checkout (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id INT NOT NULL,
  fecha_checkin DATETIME NULL,
  fecha_checkout DATETIME NULL,
  firma TEXT,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id)
);

CREATE TABLE minibar_productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE minibar_consumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  habitacion_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  fecha DATE NOT NULL,
  FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
  FOREIGN KEY (producto_id) REFERENCES minibar_productos(id)
);

CREATE TABLE empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  cargo VARCHAR(50) NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  rol VARCHAR(50) NOT NULL,
  estado ENUM('Activo','Inactivo') DEFAULT 'Activo'
);

CREATE TABLE configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_hotel VARCHAR(150),
  direccion VARCHAR(200),
  telefono VARCHAR(20),
  moneda VARCHAR(20)
);

INSERT INTO habitaciones (numero, tipo, tarifa, capacidad, estado) VALUES
('101','Sencilla',120000,1,'Disponible'),
('102','Doble',180000,2,'Ocupada'),
('201','Doble',180000,2,'En Limpieza'),
('202','Triple',240000,3,'Disponible'),
('301','Suite',350000,2,'Mantenimiento'),
('305','Triple',240000,3,'Disponible');

INSERT INTO minibar_productos (nombre, precio_unitario) VALUES
('Agua 500 ml', 5000), ('Cerveza', 7000), ('Gaseosa', 6000), ('Mani', 4000);

INSERT INTO configuracion (nombre_hotel, direccion, telefono, moneda) VALUES
('Hotel Capitolio del Llano', 'Carrera 20 # 15-35, Yopal, Casanare', '(608) 123 4567', 'COP');