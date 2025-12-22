# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY ../../pom.xml ./pom.xml

# Copy service pom
COPY pom.xml ./backend/api-gateway/pom.xml

# Copy source code
COPY src ./backend/api-gateway/src

# Build the application
WORKDIR /app/backend/api-gateway
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/backend/api-gateway/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
