FROM node:lts as build
WORKDIR /work
COPY package.json package-lock.json /work/
RUN npm ci
COPY . /work/
RUN npm run build
FROM nginx:alpine
COPY --from=build /work/dist/ /usr/share/nginx/html/
HEALTHCHECK CMD [ "wget", "-q", "0.0.0.0:80" ]
