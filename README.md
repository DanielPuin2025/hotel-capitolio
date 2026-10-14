# Hotel Capitolio del Llano

Aplicación web de administración hotelera: frontend estático y API Node.js/Express con MySQL.

## Ejecutar con Docker / EasyPanel

1. Crear una base de datos MySQL/MariaDB privada en EasyPanel e importar en ella el archivo local `base de datos_/hotel_capitolio.sql`. Ese volcado incluye registros operativos y cuentas; se excluye intencionalmente de Git.
2. Crear el servicio desde este repositorio con el `Dockerfile` de la raíz y el puerto interno `3000`.
3. Definir estas variables de entorno en el servicio:
   - `DB_HOST`: hostname interno de MySQL que proporciona EasyPanel.
   - `DB_PORT`: puerto MySQL (normalmente `3306`).
   - `DB_USER`: usuario de la base.
   - `DB_PASSWORD`: contraseña de la base.
   - `DB_NAME`: `hotel_capitolio`.
   - `JWT_SECRET`: valor aleatorio largo, generado exclusivamente para producción.
4. Configurar el dominio `hotelcapitolio.programamega.com` en este servicio y activar HTTPS en EasyPanel.
5. Montar un volumen persistente en `/app/backend/uploads` para conservar las imágenes de habitaciones al reconstruir o desplegar el contenedor. Si se deben conservar las imágenes existentes, copiar también el contenido de `backend/uploads` al volumen; ese directorio local no se publica en Git.
6. Usar `GET /healthz` como comprobación de salud.

El `Dockerfile` construye el frontend y la API en un solo servicio. La interfaz llama a la API en el mismo dominio, por lo que no requiere una URL de API distinta.

## Desarrollo local

Desde `backend`, instalar dependencias con `npm ci` y ejecutar `npm start`. Configurar las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `JWT_SECRET` en `backend/.env`.

El archivo `backend/schema.sql` es un esquema antiguo y no debe usarse para inicializar la base de EasyPanel; utilizar el volcado local indicado arriba.
