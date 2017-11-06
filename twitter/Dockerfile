# Use an official Python runtime as a parent image
FROM common:latest

# Set the working directory to /app
WORKDIR /var/www

# Copy the current directory contents into the container at /app
ADD . /var/www/app

COPY package.json /var/www
COPY package-lock.json /var/www
COPY .env /var/www

# Install any needed packages specified in requirements.txt
RUN npm i

# Make port 9002 available to the world outside this container
EXPOSE 9002

# Run app.py when the container launches
CMD ["node", "./app/index.js"]