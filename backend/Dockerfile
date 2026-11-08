FROM php:8.3-cli

# Instalar herramientas y extensiones para PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev unzip zip && docker-php-ext-install pdo pdo_pgsql

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar directorio de trabajo
WORKDIR /app
COPY . .

# Instalar dependencias de Laravel
RUN composer install --optimize-autoloader --no-dev

# Levantar el servidor
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
