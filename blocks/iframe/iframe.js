export default function decorate(block) {
  block.innerHTML = `
    <iframe src="${block.textContent.trim()}"></iframe>
  `;
}