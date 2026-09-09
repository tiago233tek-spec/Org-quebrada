// Gera um payload PIX EMV para chave estática.
// Para cobrança dinâmica/API bancária, integre o provedor de pagamentos.
function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function field(id, value) {
  return id + String(value.length).padStart(2, "0") + value;
}
function merchantAccount(key) {
  const gui = field("00", "br.gov.bcb.pix");
  const k = field("01", key);
  return field("26", gui + k);
}
function pixPayload({ key, name = "DUCK ORG", city = "SAO PAULO", amount = "" }) {
  let p = "";
  p += field("00", "01");
  p += merchantAccount(key);
  p += field("52", "0000");
  p += field("53", "986");
  if (amount) p += field("54", Number(amount).toFixed(2));
  p += field("58", "BR");
  p += field("59", name.slice(0, 25));
  p += field("60", city.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").slice(0, 15));
  p += field("62", field("05", "***"));
  p += "6304";
  return p + crc16(p);
}
module.exports = { pixPayload };
