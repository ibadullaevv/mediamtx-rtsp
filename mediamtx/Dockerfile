FROM bluenviron/mediamtx:latest

# Copy configuration
COPY mediamtx.yml /mediamtx.yml

# Expose ports
EXPOSE 8554 8888 8889

# Run mediamtx
CMD ["./mediamtx", "/mediamtx.yml"]