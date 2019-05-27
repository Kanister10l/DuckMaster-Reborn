import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, timeInterval } from 'rxjs/operators'
import { Component, Input, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'DuckMaster';

  Level = 1;
  Score = 0;
  Money = 0;
  Ammo = 2;
  maxAmmo = 2;
  reloadSpeed = 3000;
  pause = false;
  ducks: {size: number, x: number, y: number, speed: number, wingState: number, count: 0}[] = [];
  duckImages = [new Image, new Image, new Image, new Image];
  duckProbability = 0.01;
  width = 0;
  height = 0;
  wStart = 0;
  hStart = 0;
  upgrades = {quiverI: false, quiverII: false, piercer: false, windu: false, thanos: false, gold: false};
  bullet = {x: 0, y: 0, xSpeed: 0, ySpeed: 0, inUse: false, windSpeed: 0, piercer: 1};
  bulletImg = new Image;

  @ViewChild('canvas') public canvas: ElementRef;
  @ViewChild('player') public player: ElementRef;
  @ViewChild('weapon') public weapon: ElementRef;

  private cx: CanvasRenderingContext2D;
  constructor(private cookieService: CookieService) {}

  public ngAfterViewInit() {
    this.duckImages[0].src = "assets/images/duck_wings_up.png";
    this.duckImages[1].src = "assets/images/duck_wings_mid.png";
    this.duckImages[2].src = "assets/images/duck_wings_down.png";
    this.duckImages[3].src = "assets/images/duck_wings_mid.png";
    this.bulletImg.src = "assets/images/ironman_f.png";
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');
    canvasEl.width = this.canvas.nativeElement.offsetWidth;
    canvasEl.height = this.canvas.nativeElement.offsetHeight;
    this.width = this.canvas.nativeElement.offsetWidth;
    this.height = this.canvas.nativeElement.offsetHeight;
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';

    this.wStart = (this.player.nativeElement.parentElement.offsetWidth > this.player.nativeElement.parentElement.offsetHeight ? this.player.nativeElement.parentElement.offsetWidth : this.player.nativeElement.parentElement.offsetHeight)/2 + this.player.nativeElement.parentElement.offsetLeft;

    setInterval(() => {this.generateDucks(this.canvas.nativeElement.offsetHeight)}, 16);
    setInterval(() => {this.drawDucks()}, 16);
    setInterval(() => {this.moveDucks(this.canvas.nativeElement.offsetWidth)}, 16);
    setInterval(() => {this.moveBullet()}, 16);
    setInterval(() => {this.detectCollision()}, 16);
    this.captureEvents(canvasEl);
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    fromEvent(canvasEl, 'mousedown')
    .pipe(
      switchMap((e) => {
        return fromEvent(canvasEl, 'mousemove')
          .pipe(
            takeUntil(fromEvent(canvasEl, 'mouseup')),
            takeUntil(fromEvent(canvasEl, 'mouseleave'))
          )
      })
    ).subscribe((res: MouseEvent) => {
      const rect = canvasEl.getBoundingClientRect();

      let xDif = res.clientX - rect.left - this.wStart;
      let yDif = res.clientY - rect.top;
      yDif = this.height - yDif;

      let angle = Math.atan(xDif / yDif);

      this.weapon.nativeElement.style = 'transform: translate(15vmin, -45vmin) rotate(' + angle + 'rad)';
    });

    fromEvent(canvasEl, "mouseup")
      .subscribe((res: MouseEvent) => {
        const rect = canvasEl.getBoundingClientRect();
        const pos = {
          x: res.clientX - rect.left,
          y: res.clientY - rect.top
        };
        if (!this.bullet.inUse && this.Ammo > 0) {
          this.shoot(pos);
        }
      });
  }

  private drawOnCanvas( 
    currentPos: { x: number, y: number, size: number, w: number}
  ) {
    if (!this.cx) { return; }

    this.cx.drawImage(this.duckImages[currentPos.w], currentPos.x, currentPos.y, 50*currentPos.size - this.Level, 50*currentPos.size - this.Level);
  }

  private generateDucks(ySize) {
    if (this.pause) {
      return;
    }

    if (Math.random() < this.duckProbability && this.ducks.length < 10) {
      this.ducks.push({size: Math.round(Math.random()*2) + 1, x: 0, y: Math.round(Math.random()*(ySize - 240)), speed: Math.round(Math.random()*2) + 1, wingState: 0, count: 0});
    }

    return;
  }

  private drawDucks() {
    this.cx.clearRect(0, 0, this.canvas.nativeElement.offsetWidth, this.canvas.nativeElement.offsetHeight);
    this.ducks.forEach(element => {
      this.drawOnCanvas({x:element.x, y:element.y, size: element.size, w: element.wingState});
      element.count++;
      if (element.count > 10) {
        element.wingState++;
        element.count = 0;
        if (element.wingState > 3) {
          element.wingState = 0;
        }
      }
    });

    if (this.bullet.inUse) {
      this.cx.drawImage(this.bulletImg, this.bullet.x, this.height - this.bullet.y, 20, 20);
    }
  }

  private moveDucks(xSize) {
    for (let i = 0; i < this.ducks.length; i++) {
      this.ducks[i].x += this.ducks[i].speed + this.Level;
      if (this.ducks[i].x > xSize) {
        this.ducks.splice(i, 1);
      }
    }
  }

  private shoot(pos: { x: number, y: number}) {
    this.Ammo--;
    if (this.Ammo == 0) {
      setTimeout(() => this.reload(), this.reloadSpeed);
    }
    this.bullet = {x: this.wStart, y: this.hStart, xSpeed: (pos.x - this.wStart)/(this.width - this.wStart), ySpeed: (this.height - pos.y)/(this.width - this.wStart), inUse: true, windSpeed: Math.random()/500, piercer: 1}
    if (this.upgrades.windu) {
      this.bullet.windSpeed = 0;
    }
    if (this.upgrades.piercer) {
      this.bullet.piercer = 2;
    }
  }

  private moveBullet() {
    if (this.bullet.inUse){
      this.bullet.x += this.bullet.xSpeed*30;
      this.bullet.y += this.bullet.ySpeed*30;
      if (!this.upgrades.thanos) {
        this.bullet.ySpeed -= 0.002;
      }
      this.bullet.xSpeed -= this.bullet.windSpeed;

      if (this.bullet.x > this.width || this.bullet.y < 0 || this.bullet.y > this.height || this.bullet.x < 0) {
        this.bullet.inUse = false;
      }
    }
  }

  private detectCollision() {
    if (this.bullet.inUse) {
      for (let i = 0; i < this.ducks.length; i++) {
        if (this.bullet.x > this.ducks[i].x && this.bullet.x < this.ducks[i].x + 50 * this.ducks[i].size - this.Level) {
          if (this.height - this.bullet.y > this.ducks[i].y && this.height - this.bullet.y < this.ducks[i].y + 50 * this.ducks[i].size - this.Level) {
            var tmpPoints = 4 - this.ducks[i].size + this.Level;
            if (this.upgrades.gold) {
              tmpPoints *= 2;
            }
            this.Score += tmpPoints;
            if (this.Score > 100 * this.Level) {
              this.Level++;
            }
            this.Money += 2;
            this.bullet.piercer--;
            if (this.bullet.piercer == 0){
              this.bullet.inUse = false;
            }
            this.ducks.splice(i, 1);
            return;
          }
        }
      }
    }
  }

  private reload() {
    this.Ammo = this.maxAmmo;
  }

  public buyThanos() {
    if (this.Money >= 1000 && !this.upgrades.thanos) {
      this.Money -= 1000;
      this.upgrades.thanos = true;
      this.duckImages[0].src = "assets/images/ironman_n.png";
      this.duckImages[1].src = "assets/images/ironman_f.png";
      this.duckImages[2].src = "assets/images/ironman_n.png";
      this.duckImages[3].src = "assets/images/ironman_f.png";
      this.bulletImg.src = "assets/images/duck_wings_up.png";
      this.weapon.nativeElement.src = "assets/images/thanos_color.png";
    }
  }

  public buyGold() {
    if (this.Money >= 1000 && !this.upgrades.gold) {
      this.Money -= 1000;
      this.upgrades.gold = true;
      this.canvas.nativeElement.style = "background-image: url('assets/images/clouds_golden.png');"
    }
  }

  public buyQ1() {
    if (this.Money >= 50 && !this.upgrades.quiverI) {
      this.Money -= 50;
      this.upgrades.quiverI = true;
      if (!this.upgrades.quiverII) {
        this.maxAmmo = 4;
        this.reloadSpeed = 2000;
      }
    }
  }

  public buyQ2() {
    if (this.Money >= 150 && !this.upgrades.quiverII) {
      this.Money -= 150;
      this.upgrades.quiverII = true;
      this.maxAmmo = 6;
      this.reloadSpeed = 1000;
    }
  }

  public buyWindu() {
    if (this.Money >= 100 && !this.upgrades.windu) {
      this.Money -= 100;
      this.upgrades.windu = true;
    }
  }

  public buyPiercer() {
    if (this.Money >= 300 && !this.upgrades.piercer) {
      this.Money -= 300;
      this.upgrades.piercer = true;
    }
  }

  public loadGame() {
    const save = this.cookieService.get("duck_save");
    const saveObj = JSON.parse(save);
    if (saveObj.valid) {
      this.Money = saveObj.money;
      this.Score = saveObj.score;
      this.ducks = saveObj.ducks;
      this.Level = saveObj.level;
      if (saveObj.upgrades.quiverI) {
        this.upgrades.quiverI = true;
        if (!this.upgrades.quiverII) {
          this.maxAmmo = 4;
          this.reloadSpeed = 2000;
        }
      }
      if (saveObj.upgrades.quiverII) {
        this.upgrades.quiverII = true;
        this.maxAmmo = 6;
        this.reloadSpeed = 1000;
      }
      if (saveObj.upgrades.windu) {
        this.upgrades.windu = true;
      }
      if (saveObj.upgrades.piercer) {
        this.upgrades.piercer = true;
      }
      if (saveObj.upgrades.thanos) {
        this.upgrades.thanos = true;
        this.duckImages[0].src = "assets/images/ironman_n.png";
        this.duckImages[1].src = "assets/images/ironman_f.png";
        this.duckImages[2].src = "assets/images/ironman_n.png";
        this.duckImages[3].src = "assets/images/ironman_f.png";
        this.bulletImg.src = "assets/images/duck_wings_up.png";
      }
      if (saveObj.upgrades.gold) {
        this.upgrades.gold = true;
        this.canvas.nativeElement.style = "background-image: url('assets/images/clouds_golden.png');"
      }
    }
  }

  public saveGame() {
    this.cookieService.set("duck_save", JSON.stringify({
      valid: true,
      upgrades: this.upgrades,
      level: this.Level,
      money: this.Money,
      score: this.Score,
      ducks: this.ducks
    }));
  }

  public test(event) {
    alert(this.ducks.length);
  }
}
