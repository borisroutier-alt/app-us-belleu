import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Récupération du payload envoyé par le Webhook
    const payload = await req.json()
    console.log("Payload reçu du Webhook :", JSON.stringify(payload))
    
    // Le Webhook envoie le nouvel objet dans 'record'
    const record = payload.record
    const title = record?.title || "Nouvelle actualité !"
    const description = record?.description || record?.contenu || "Découvrez notre dernière info club."

    // 2. Initialisation du client Supabase avec la clé SERVICE_ROLE
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Récupération des tokens dans la table 'licencies_autorises'
    const { data: users, error } = await supabaseClient
      .from('licencies_autorises')
      .select('expo_push_token')
      .not('expo_push_token', 'is', null)

    if (error) {
      console.error("Erreur base de données :", error)
      throw error
    }

    // Extraction et dédoublonnage des tokens
    const tokens = [...new Set(users.map(u => u.expo_push_token).filter(Boolean))]
    
    if (tokens.length === 0) {
      console.log("Aucun token trouvé en base.")
      return new Response(JSON.stringify({ message: "Aucun token trouvé." }), { status: 200 })
    }

    console.log(`Envoi de ${tokens.length} notifications...`)

    // 4. Envoi vers l'API Expo Push
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'accept-encoding': 'gzip, deflate'
      },
      body: JSON.stringify(tokens.map(token => ({
        to: token,
        title: `📢 U.S. Belleu : ${title}`,
        body: description,
        sound: 'default',
        badge: 1
      }))),
    })

    // 5. Récupération et log de la réponse Expo pour diagnostiquer l'erreur Firebase
    const result = await response.json()
    console.log("Réponse de l'API Expo :", JSON.stringify(result))

    return new Response(JSON.stringify({ success: true, result }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err) {
    console.error("Erreur générale :", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})