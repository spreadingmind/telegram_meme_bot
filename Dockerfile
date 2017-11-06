# Use an official Python runtime as a parent image
FROM node:alpine

# Set the working directory to /app
WORKDIR /var/www

# Copy the current directory contents into the container at /app
ADD tools /var/www/tools