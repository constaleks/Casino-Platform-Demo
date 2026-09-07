FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        bcmath \
        pcntl \
        zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY _docker/php/php.ini /usr/local/etc/php/conf.d/99-custom.ini

WORKDIR /var/www/backend

EXPOSE 9000

CMD ["php-fpm"]