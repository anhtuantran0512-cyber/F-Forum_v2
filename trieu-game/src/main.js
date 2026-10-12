import Phaser from 'phaser';
import { generateTextures } from './art.js';
import GameScene from './scenes/GameScene.js';

// Boot: sinh toàn bộ sprite bằng code rồi chuyển sang màn chơi.
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }
  create() {
    generateTextures(this);
    this.scene.start('GameScene');
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#05121f',
  pixelArt: true,        // giữ răng cưa pixel, không làm mượt
  roundPixels: true,
  antialias: false,
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: undefined,
  scene: [BootScene, GameScene],
});
