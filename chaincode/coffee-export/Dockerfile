# Minimal Dockerfile for CCAAS
# Assumes chaincode is pre-built

FROM alpine:3.18

WORKDIR /app

# Copy the pre-built chaincode binary
COPY chaincode .

# Make chaincode executable
RUN chmod +x ./chaincode

# Expose the chaincode port
EXPOSE 7052

# Run the chaincode
CMD ["./chaincode"]
