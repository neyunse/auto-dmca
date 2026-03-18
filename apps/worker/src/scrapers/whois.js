import axios from 'axios';

export const lookupHost = async (domain) => {
  // Using a free mock integration or public API (like RDAP)
  // For production, WhoisXML API is recommended.
  console.log(`[WHOIS] Resolving host for ${domain}`);
  try {
     const response = await axios.get(`https://rdap.org/domain/${domain}`);
     const entities = response.data.entities || [];
     
     // Very naive extraction for demonstration purposes
     let abuseEmail = null;
     for (const entity of entities) {
        if (entity.vcardArray && entity.vcardArray[1]) {
           const emailProp = entity.vcardArray[1].find(p => p[0] === 'email');
           if (emailProp) {
              abuseEmail = emailProp[3];
              break;
           }
        }
     }

     return {
        domain,
        abuseEmail: abuseEmail || 'abuse@unknown-host.com'
     };
  } catch (err) {
     console.error(`[WHOIS] Error resolving ${domain}:`, err.message);
     return {
        domain,
        abuseEmail: 'abuse-unknown@fallback.com'
     };
  }
};
