FROM node:6

RUN mkdir -p /opt/app

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# By default app listens on port 5000
# Also expose ports for debugging purposes
ARG PORT=5000
ENV PORT $PORT
EXPOSE $PORT 9229 9230

WORKDIR /opt

# Copy and set up packages first, and keep it out of the local path for easier bind mounting
COPY package.json yarn.lock* ./
RUN yarn install
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . ./

USER node

CMD ["node", "app.js"]