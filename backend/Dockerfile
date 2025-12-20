# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the applications
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o seed ./cmd/seed
RUN CGO_ENABLED=0 GOOS=linux go build -o migrate ./cmd/migrate

# Run stage
FROM alpine:latest

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/api .
COPY --from=builder /app/seed .
COPY --from=builder /app/migrate .

EXPOSE 8080

CMD ["./api"]
