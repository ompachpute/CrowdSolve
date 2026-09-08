# CrowdSolve Backend Dockerfile

# Stage 1: Build the jar using Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the jar with a lightweight Java image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/portal-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]