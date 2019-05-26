import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, timeInterval } from 'rxjs/operators'
import { Component, Input, ElementRef, AfterViewInit, ViewChild } from '@angular/core';

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
  Ammo = 10;
  pause = false;
  ducks: {size: number, x: number, y: number, speed: number}[] = [];
  duckImage = new Image;
  duckProbability = 0.01;
  width = 0;
  height = 0;
  bullet = {x: 0, y: 0, xSpeed: 0, ySpeed: 0, inUse: false};

  @ViewChild('canvas') public canvas: ElementRef;

  private cx: CanvasRenderingContext2D;

  public ngAfterViewInit() {
    this.duckImage.src = "assets/images/duck.png";
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');
    canvasEl.width = this.canvas.nativeElement.offsetWidth;
    canvasEl.height = this.canvas.nativeElement.offsetHeight;
    this.width = this.canvas.nativeElement.offsetWidth;
    this.height = this.canvas.nativeElement.offsetHeight;
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';
    setInterval(() => {this.generateDucks(this.canvas.nativeElement.offsetHeight)}, 16);
    setInterval(() => {this.drawDucks()}, 16);
    setInterval(() => {this.moveDucks(this.canvas.nativeElement.offsetWidth)}, 16);
    setInterval(() => {this.moveBullet()}, 16);
    setInterval(() => {this.detectCollision()}, 16);
    setInterval(() => {this.Level += 1}, 10 * 1000);
    this.captureEvents(canvasEl);
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    /*fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          return fromEvent(canvasEl, 'mousemove')
            .pipe(
              takeUntil(fromEvent(canvasEl, 'mouseup')),
              takeUntil(fromEvent(canvasEl, 'mouseleave')),
              pairwise()
            )
        })
      )
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();
  
        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };
  
        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };
        this.Level = currentPos.y;
      });*/

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
    currentPos: { x: number, y: number, size: number }
  ) {
    if (!this.cx) { return; }

    this.cx.drawImage(this.duckImage, currentPos.x, currentPos.y, 50*currentPos.size - this.Level, 50*currentPos.size - this.Level);
  }

  private generateDucks(ySize) {
    if (this.pause) {
      return;
    }

    if (Math.random() <  this.duckProbability && this.ducks.length < 10) {
      this.ducks.push({size: Math.round(Math.random()*2) + 1, x: 0, y: Math.round(Math.random()*(ySize - 240)), speed: Math.round(Math.random()*2) + 1});
    }

    return
  }

  private drawDucks() {
    this.cx.clearRect(0, 0, this.canvas.nativeElement.offsetWidth, this.canvas.nativeElement.offsetHeight);
    this.ducks.forEach(element => {
      this.drawOnCanvas({x:element.x, y:element.y, size: element.size});
    });

    if (this.bullet.inUse) {
      this.cx.beginPath();
      this.cx.moveTo(this.bullet.x, this.height - this.bullet.y);
      this.cx.lineTo(this.bullet.x + 10, this.height - this.bullet.y - 10);
      this.cx.stroke();
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
    this.bullet = {x: 0, y: 0, xSpeed: pos.x/this.width, ySpeed: (this.height - pos.y)/this.height, inUse: true}
  }

  private moveBullet() {
    if (this.bullet.inUse){
      this.bullet.x += this.bullet.xSpeed*30;
      this.bullet.y += this.bullet.ySpeed*30;
      this.bullet.ySpeed -= 0.01;

      if (this.bullet.x > this.width || this.bullet.y < 0) {
        this.bullet.inUse = false;
      }
    }
  }

  private detectCollision() {
    if (this.bullet.inUse) {
      for (let i = 0; i < this.ducks.length; i++) {
        if (this.bullet.x > this.ducks[i].x && this.bullet.x < this.ducks[i].x + 50 * this.ducks[i].size - this.Level) {
          if (this.height - this.bullet.y > this.ducks[i].y && this.height - this.bullet.y < this.ducks[i].y + 50 * this.ducks[i].size - this.Level) {
            this.Score += 4 - this.ducks[i].size + this.Level;
            this.Money += 2;
            this.bullet.inUse = false;
            this.ducks.splice(i, 1);
            return;
          }
        }
      }
    }
  }

  public test(event) {
    alert(this.ducks.length);
  }
}
