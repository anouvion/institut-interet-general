# Institut des Projets d'Intérêt Général

Site chapeau : grille des projets d'Arnaud Nouvion, avec captures d'écran actualisées automatiquement.
Domaine : institut-interet-general.org - repo : anouvion/institut-interet-general - éditeur : Suricate (EURL).

## Fonctionnement
- `sites.json` est la seule source de vérité : ajouter, retirer ou réordonner un site se fait uniquement là.
- `.github/workflows/captures.yml` tourne chaque lundi (et à chaque modification de `sites.json`) : Playwright capture chaque page d'accueil en 1440x900, conversion WebP 1200px 80 %, régénération de la grille dans `public/index.html`, commit, puis Netlify redéploie.
- Si un site ne répond pas, la capture précédente est conservée.
- Le commit hebdomadaire (date dans le footer) garde le workflow actif : GitHub désactive les tâches planifiées d'un repo inactif depuis 60 jours.

## Mise en route (Claude Code)
1. Créer le repo `anouvion/institut-interet-general` et pousser ce dossier (sans `node_modules`).
2. Netlify : importer le repo, dossier de publication `public` (déjà dans `netlify.toml`), aucune commande de build.
3. Domaine `institut-interet-general.org` sur Namecheap : A @ 75.2.60.5, CNAME www vers le sous-domaine netlify.app.
4. GitHub > Actions > "Captures hebdomadaires" > Run workflow, pour générer les premières captures.
5. À compléter dans `public/index.html` : remplacer `[LINKEDIN_URL]` et ajouter `public/img/arnaud-nouvion.webp` (reprendre la photo et le lien du site Le Patient Informé).
6. Vérifier dans le log du workflow les sites en ECHEC (URL à corriger dans `sites.json`) : French Food 40, HELIX et Maison de l'Artemisia notamment.

## En local
`npm install && npx playwright install chromium && npm run update`
`npm run render` régénère la grille sans prendre de captures.

## Règles
Tirets courts uniquement, aucun traceur ni cookie, alt sur les images, responsive mobile-first. Pas de hero sur ce site (choix validé).
