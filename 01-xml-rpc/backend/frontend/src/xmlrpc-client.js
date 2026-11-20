// ============================================
// Client XML-RPC en JavaScript pur
// Permet de communiquer avec le backend Spring Boot via XML-RPC
// ============================================

const XML_RPC_ENDPOINT = 'http://localhost:8081/rpc';

/**
 * Encode une valeur JavaScript en XML-RPC
 * @param {*} value - La valeur à encoder
 * @returns {string} - La chaîne XML encodée
 */
function encodeValue(value) {
  if (value === null || value === undefined) {
    return '<value><nil/></value>';
  }
  
  if (typeof value === 'boolean') {
    return `<value><boolean>${value ? 1 : 0}</boolean></value>`;
  }
  
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `<value><int>${value}</int></value>`;
    } else {
      return `<value><double>${value}</double></value>`;
    }
  }
  
  if (typeof value === 'string') {
    // Échapper les caractères spéciaux XML
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    return `<value><string>${escaped}</string></value>`;
  }
  
  if (value instanceof Date) {
    // Format ISO 8601 pour XML-RPC
    const iso = value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return `<value><dateTime.iso8601>${iso}</dateTime.iso8601></value>`;
  }
  
  if (Array.isArray(value)) {
    const items = value.map(item => encodeValue(item)).join('');
    return `<value><array><data>${items}</data></array></value>`;
  }
  
  if (typeof value === 'object') {
    const members = Object.entries(value)
      .map(([key, val]) => `<member><name>${key}</name>${encodeValue(val)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }
  
  return `<value><string>${String(value)}</string></value>`;
}

/**
 * Décode une valeur XML-RPC en JavaScript
 * @param {string} xml - La chaîne XML à décoder
 * @returns {*} - La valeur JavaScript décodée
 */
function decodeValue(xml) {
  // Nettoyer le XML
  xml = xml.trim();
  
  // Extraire le contenu entre <value> et </value>
  const match = xml.match(/<value>(.*?)<\/value>/s);
  if (!match) return null;
  
  const content = match[1].trim();
  
  if (content.startsWith('<nil/>')) {
    return null;
  }
  
  if (content.startsWith('<boolean>')) {
    return parseInt(content.replace(/<\/?boolean>/g, '')) === 1;
  }
  
  if (content.startsWith('<int>')) {
    return parseInt(content.replace(/<\/?int>/g, ''));
  }
  
  if (content.startsWith('<double>')) {
    return parseFloat(content.replace(/<\/?double>/g, ''));
  }
  
  if (content.startsWith('<string>')) {
    let str = content.replace(/<\/?string>/g, '');
    // Déchapper les caractères XML
    str = str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    return str;
  }
  
  if (content.startsWith('<dateTime.iso8601>')) {
    const iso = content.replace(/<\/?dateTime\.iso8601>/g, '');
    return new Date(iso);
  }
  
  if (content.startsWith('<array>')) {
    const dataMatch = content.match(/<data>(.*?)<\/data>/s);
    if (!dataMatch) return [];
    const values = dataMatch[1].match(/<value>.*?<\/value>/gs) || [];
    return values.map(decodeValue);
  }
  
  if (content.startsWith('<struct>')) {
    const obj = {};
    const members = content.match(/<member>.*?<\/member>/gs) || [];
    members.forEach(member => {
      const nameMatch = member.match(/<name>(.*?)<\/name>/s);
      const valueMatch = member.match(/<value>.*?<\/value>/s);
      if (nameMatch && valueMatch) {
        obj[nameMatch[1]] = decodeValue(valueMatch[0]);
      }
    });
    return obj;
  }
  
  return content;
}

/**
 * Construit une requête XML-RPC
 * @param {string} methodName - Le nom de la méthode à appeler
 * @param {Array} params - Les paramètres de la méthode
 * @returns {string} - La requête XML complète
 */
function buildRequest(methodName, params) {
  const paramXml = params.map(p => encodeValue(p)).join('');
  
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>${methodName}</methodName>
  <params>
    ${paramXml}
  </params>
</methodCall>`;
}

/**
 * Parse la réponse XML-RPC
 * @param {string} xml - La réponse XML
 * @returns {Array} - Les valeurs de retour
 */
function parseResponse(xml) {
  // Vérifier s'il y a une erreur
  const faultMatch = xml.match(/<fault>.*?<\/fault>/s);
  if (faultMatch) {
    const faultCode = faultMatch[0].match(/<int>(.*?)<\/int>/s);
    const faultString = faultMatch[0].match(/<string>(.*?)<\/string>/s);
    const error = new Error(`XML-RPC Fault: ${faultString ? faultString[1] : 'Unknown error'}`);
    error.faultCode = faultCode ? parseInt(faultCode[1]) : 0;
    throw error;
  }
  
  // Extraire les paramètres de retour
  const paramsMatch = xml.match(/<params>(.*?)<\/params>/s);
  if (!paramsMatch) return [];
  
  const values = paramsMatch[1].match(/<value>.*?<\/value>/gs) || [];
  return values.map(decodeValue);
}

/**
 * Envoie une requête XML-RPC au serveur
 * @param {string} methodName - Le nom de la méthode
 * @param {Array} params - Les paramètres
 * @returns {Promise<Array>} - Les résultats
 */
async function xmlRpcCall(methodName, params = []) {
  const body = buildRequest(methodName, params);
  
  console.log(`[XML-RPC] Appel: ${methodName}`, params);
  console.log(`[XML-RPC] Requête XML:`, body);
  
  try {
    const response = await fetch(XML_RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      body: body,
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log(`[XML-RPC] Réponse XML:`, xmlText);
    
    const results = parseResponse(xmlText);
    console.log(`[XML-RPC] Résultat décodé:`, results);
    
    return results;
  } catch (error) {
    console.error(`[XML-RPC] Erreur:`, error);
    throw error;
  }
}

/**
 * Service pour gérer les personnes via XML-RPC
 */
const PersonneService = {
  /**
   * Ajoute une nouvelle personne
   * @param {Object} personne - { nom, prenom, dateNaissance, adresse, telephone }
   * @returns {Promise<number>} - L'ID de la personne créée
   */
  async ajouter(personne) {
    const results = await xmlRpcCall('ajouter', [personne]);
    return results[0];
  },
  
  /**
   * Recherche une personne par son ID
   * @param {number} id - L'ID de la personne
   * @returns {Promise<Object>} - La personne trouvée
   */
  async rechercher(id) {
    const results = await xmlRpcCall('rechercher', [id]);
    return results[0];
  },
  
  /**
   * Liste toutes les personnes
   * @returns {Promise<Array>} - La liste des personnes
   */
  async lister() {
    const results = await xmlRpcCall('lister', []);
    return results[0] || [];
  },
  
  /**
   * Modifie une personne existante
   * @param {Object} personne - La personne avec les nouvelles données
   * @returns {Promise<boolean>} - True si la modification a réussi
   */
  async modifier(personne) {
    const results = await xmlRpcCall('modifier', [personne]);
    return results[0];
  },
  
  /**
   * Supprime une personne par son ID
   * @param {number} id - L'ID de la personne à supprimer
   * @returns {Promise<boolean>} - True si la suppression a réussi
   */
  async supprimer(id) {
    const results = await xmlRpcCall('supprimer', [id]);
    return results[0];
  },
  
  /**
   * Vérifie si le serveur XML-RPC est accessible
   * @returns {Promise<boolean>} - True si le serveur répond
   */
  async ping() {
    try {
      // On tente une requête simple pour vérifier la connectivité
      await fetch(XML_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: buildRequest('lister', []),
      });
      return true;
    } catch {
      return false;
    }
  },
};

export default PersonneService;
