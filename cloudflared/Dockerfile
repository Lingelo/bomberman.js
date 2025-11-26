# Cloudflare Tunnel for HTTPS without domain
FROM cloudflare/cloudflared:latest

# Copy config if needed
COPY cloudflared-config.yml /etc/cloudflared/config.yml

# Use tunnel command
ENTRYPOINT ["cloudflared", "tunnel"]
CMD ["--config", "/etc/cloudflared/config.yml", "run"]
