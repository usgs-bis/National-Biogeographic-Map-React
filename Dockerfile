# base image
FROM node:10.14

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
RUN npm install

COPY ./entrypoint.sh /usr/src/app/
# Set file permissions
RUN ["chmod", "+x", "/usr/src/app/entrypoint.sh"]
# start app
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
