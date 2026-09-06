FROM golang:1.27 AS build
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server

FROM alpine:3.22
RUN apk add --no-cache ca-certificates \
  && adduser -D -u 10001 app
COPY --from=build /out/server /server
USER app
EXPOSE 8080
ENTRYPOINT ["/server"]