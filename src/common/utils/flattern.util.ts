// src/common/utils/flattern.util.ts
export function flattenObject(obj: any, prefix = '', separator = '', excludeKeys: string[] = ['id']): any {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Si estamos en una relación y la key es 'id', la saltamos
      if (prefix && excludeKeys.includes(key)) {
        continue;
      }
      
      // Para relaciones, usar solo el nombre del campo sin el prefijo de la entidad
      let newKey;
      if (prefix && key !== 'id') {
        // Extraer solo el nombre del campo de la relación
        newKey = key;
      } else {
        newKey = prefix ? `${prefix}${separator}${key}` : key;
      }
      
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        // Si es un objeto, recursivamente aplanarlo
        Object.assign(flattened, flattenObject(obj[key], newKey, separator, excludeKeys));
      } else {
        // Si no es objeto, asignar directamente
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
}