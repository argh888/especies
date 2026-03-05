// Colores bonitos y contrastantes, puedes personalizar según especies
window.colorMap = [
  "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231", "#911eb4", "#46f0f0",
  "#f032e6", "#d2f53c", "#fabebe", "#008080", "#e6beff", "#aa6e28", "#fffac8",
  "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080", "#FFFFFF", "#000000"
];
// Asigna color por especie, siempre igual rápido
window.getColorForSpecies = function(species, speciesArr) {
  const idx = speciesArr.indexOf(species);
  return colorMap[idx % colorMap.length];
}