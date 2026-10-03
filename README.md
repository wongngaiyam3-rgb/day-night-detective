# 日夜偵探｜觀察與發現

香港小學日夜互動教學活動。學生可轉動 3D 地球、切換觀察視角、追蹤四個觀察點，並從地面小人的視野比較太陽和地平線，完成三個小挑戰。

## 已包含

- 地球自轉、播放／暫停、速度、角度拉桿及步進按鈕。
- 約 23.5° 傾斜地軸、立體及北極俯視。
- 右上角小人的視野，跟隨 A／B／C／D 觀察點。
- 手機與桌面版面、地表影像及本地字型。
- WebGL 3D 顯示及沒有圖像加速時的 3D 軟件渲染。

## 網站檔案

此包包含已編譯的網站及可修改的原始碼，可直接部署到 GitHub Pages。網站根目錄是可使用的靜態版本，`source/` 是修改及重新編譯用的原始碼。

## GitHub Pages

1. 建立或選定儲存庫，把本包內的檔案放到儲存庫根目錄，保留 `assets/`、`vendor/` 及 `.nojekyll`。
2. 在 Settings → Pages → Build and deployment 選擇 Deploy from a branch。
3. 選擇已上傳檔案的分支及 `/(root)`，儲存後等候部署完成。
4. 以 GitHub 顯示的實際網址開啟並測試，切勿猜測部署網址。

官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 修改及重新編譯

網站根目錄已可直接由靜態主機提供，不需要伺服器或 API 密鑰。原始碼在 `source/`，需要 Node.js 22.13 或以上。

```sh
cd source
npm install
npm run build
```

把 `source/dist/` 內檔案複製到儲存庫根目錄，保留 `.nojekyll` 及原始碼，再提交。依賴版本已固定為本次通過編譯的版本。

## 教學模型

地軸傾斜，地球沿着該軸由西向東自轉。受光方向固定在春分／秋分附近的情況，用來集中觀察日夜；沒有模擬公轉、季節、大氣折射或實際日出日落時間。大小、距離與播放速度並非實際比例。小人的天空是同步的方向與高度示意。

## 驗證

本版本通過 TypeScript 檢查及靜態編譯；已在儲存庫子目錄形式的瀏覽器預覽中確認地球影像、字型及日夜／地面視野同步。此前版本已完成手機 320／390 像素寬度與主要互動檢查。

## 第三方素材

地表影像及 Three.js：`vendor/ASSET-SOURCES.txt`、`vendor/THREE-LICENSE.txt`；字型授權：`FONT-LICENSE.txt`。網站自有內容的授權由擁有人另行決定。
