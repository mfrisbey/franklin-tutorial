export default function decorate(block) {
  block.addEventListener('dragstart', () => console.log('DRAAAAG'));
}