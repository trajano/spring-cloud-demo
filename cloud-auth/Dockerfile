FROM jboss/keycloak:10.0.0
COPY realm-export.json /tmp
ENV KEYCLOAK_IMPORT=/tmp/realm-export.json
ENV KEYCLOAK_USER=admin
ENV KEYCLOAK_PASSWORD=admin
