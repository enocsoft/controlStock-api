# --- Etapa de build ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cachear dependencias primero (solo se reinstalan si cambian go.mod/go.sum)
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api

# --- Etapa final (imagen liviana) ---
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /api /app/api

EXPOSE 8080
ENTRYPOINT ["/app/api"]
