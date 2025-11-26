# Configuration HTTPS avec Cloudflare Tunnel

Cette solution permet d'avoir un serveur HTTPS **gratuit** sans nom de domaine via Docker.

## Comment ça marche ?

Cloudflare Tunnel crée automatiquement une URL HTTPS publique (ex: `https://xyz.trycloudflare.com`) qui pointe vers votre serveur local.

## Démarrage

### 1. Lancer le serveur avec Docker

```bash
# Démarrer tous les services (serveur + tunnel HTTPS)
docker-compose up -d

# Voir les logs du tunnel pour récupérer l'URL HTTPS
docker-compose logs -f cloudflared
```

### 2. Récupérer l'URL HTTPS

Dans les logs de `cloudflared`, vous verrez quelque chose comme :

```
cloudflared-1  | 2025-01-27T10:30:45Z INF +--------------------------------------------------------------------------------------------+
cloudflared-1  | 2025-01-27T10:30:45Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
cloudflared-1  | 2025-01-27T10:30:45Z INF |  https://abc-def-123.trycloudflare.com                                                    |
cloudflared-1  | 2025-01-27T10:30:45Z INF +--------------------------------------------------------------------------------------------+
```

### 3. Configurer GitHub Actions

Mettez à jour la variable GitHub `VITE_SERVER_URL` avec l'URL HTTPS obtenue :

1. Allez sur GitHub : `Settings` → `Secrets and variables` → `Actions` → `Variables`
2. Modifiez `VITE_SERVER_URL` avec votre URL HTTPS (ex: `https://abc-def-123.trycloudflare.com`)

### 4. Redéployer

Poussez un commit ou déclenchez manuellement le workflow GitHub Actions. Le site utilisera maintenant l'URL HTTPS.

## Notes importantes

- ⚠️ **L'URL change à chaque redémarrage** du conteneur cloudflared (gratuit)
- ✅ Pour une URL fixe, créez un compte Cloudflare (toujours gratuit) et utilisez un tunnel nommé
- ✅ Le certificat HTTPS est **valide** (pas d'avertissement navigateur)
- ✅ Aucun nom de domaine requis

## URL fixe (optionnel)

Pour garder la même URL HTTPS :

```bash
# 1. Créez un compte sur cloudflare.com (gratuit)
# 2. Installez cloudflared localement
# 3. Authentifiez-vous
cloudflared tunnel login

# 4. Créez un tunnel nommé
cloudflared tunnel create bomberman

# 5. Configurez le tunnel
cloudflared tunnel route dns bomberman bomberman.trycloudflare.com

# 6. Modifiez docker-compose.yml avec votre tunnel ID
```

## Arrêt

```bash
docker-compose down
```

## Alternative : ngrok

Si vous préférez ngrok :

```bash
# Remplacez le service cloudflared dans docker-compose.yml par :
ngrok:
  image: ngrok/ngrok:latest
  command: http server:3000
  environment:
    - NGROK_AUTHTOKEN=your_token_here  # Requis pour ngrok
  depends_on:
    - server
```
