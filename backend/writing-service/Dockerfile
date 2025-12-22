# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY ../../pom.xml ./pom.xml

# Copy service pom
COPY pom.xml ./backend/writing-service/pom.xml

# Copy source code
COPY src ./backend/writing-service/src

# Build the application
WORKDIR /app/backend/writing-service
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/backend/writing-service/target/*.jar app.jar

# Expose port
EXPOSE 8081

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
