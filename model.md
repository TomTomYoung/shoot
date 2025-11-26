# Complete Integrated STG Mathematical Model (STG2.0)

(ここに前回構築した統合モデル全文を Markdown として配置します。)

以下に、モデルを AI エージェントが読み取り可能な形で Markdown としてまとめています。

---

# 完全統合STG数理モデル `\mathfrak{G}_{\mathrm{STG2.0}}`

## 1. 時間・モード・入力・乱数

### 1.1 時間とモード

* 離散時間: `T = {0,1,2,...}`
* モード集合: `{Title, Play, Pause, Dialogue, Result, GameOver}`

### 1.2 入力ベクトル

```
I_t = (axis_x, axis_y, shot, bomb, focus, pause, skip, menu)
```

### 1.3 乱数状態と再現性

* RNG は状態 `R_t` としてゲーム状態に埋め込む。
* 決定的写像: `(G_{t+1},E_{t+1}) = Step(G_t, I_t)`

---

## 2. 座標空間・階層構造・カメラ

### 2.1 座標

* 世界座標 `Ω`、画面座標 `Screen`
* カメラ写像: `Cam_t : Ω → Screen`

### 2.2 階層構造

* 各エンティティは local / world の 2 系列の状態を持つ。
* 世界変換写像 `Φ(u)` により `M^{(W)}` を計算。

---

## 3. セルグリッド・形状・ヒットボックス

### 3.1 セルグリッド

```
S_u ∈ (Σ ∪ {null, destroyed})^{R×C}
```

### 3.2 セル → ローカル矩形

```
Rect_{i,j}^{(L)}
```

セルサイズと基準点から構成。

### 3.3 ヒットボックス

```
H(u) = ⋃ Rect_{i,j}^{(W)}
```

`destroyed` なら消滅。

---

## 4. エンティティ型・衝突マトリクス

### 4.1 型

```
{Player, Enemy, PlayerShot, EnemyShot, Item, Terrain, Spawner, StageController, Effect}
```

### 4.2 衝突マトリクス `C(type(u), type(v))`

---

## 5. ゲーム状態 G_t

```
G_t = (U_t, M_t, Res_t, Stage_t, R_t)
```

### 5.1 Res_t

```
(score, mult, chain, lives, bombs, power, rank, timer)
```

### 5.2 Stage_t

wave 制御を含む:

```
Stage_t = (τ_t, waveId, waveState)
```

---

## 6. 弾幕・敵AI・ステージ脚本

### 6.1 弾幕 DSL

```
B(t, emitter, R_t) → {BulletDef, x_L, v_L}
```

### 6.2 敵AI

```
AI_e(e, G_t, R_t) → (e', SpawnReq, Audio, ΔRes, R')
```

### 6.3 Wave / StageStep

```
StageStep(Stage_t, Res_t, M_t) → (Stage_{t+1}, S_spawn, E_stage, M')
```

---

## 7. 壁（Terrain/Wall）

* `Terrain` 型として扱う。
* ドットパターン: `D_t ⊂ ℤ²`
* ノイズによる定義:

```
D_t = {(i,j) | Noise(i*s_x, j*s_y, t*s_t) ≥ θ}
```

* ワールド位置:

```
x_{i,j}^{(W)} = Cam_t^{-1}(screenCoord(i,j))
```

---

## 8. スポナー（Spawner）

* 型として `Spawner` を追加。
* ロジック:

```
SpawnerStep(u, G_t, R_t) → (u', S_spawn, E, R')
```

* Stage のスポーン要求と統合。

---

## 9. 更新パイプライン

Phase 0: 入力・モード処理
Phase 1: StageStep（wave 制御）
Phase 2: LogicStep（スポナー含む）
Phase 3: 階層解決 Φ(u)
Phase 4: 衝突検出
Phase 5: Resolve + Res 集計
Phase 6: Cleanup + Spawn Apply
Phase 7: Event 統合

---

## 10. 最終タプル

```
G = ⟨T, Ω, Screen, M, Tset, Σ,
      GridSys, Hierarchy, ResSpace, StageSpace, R,
      B, AI, StageStep, C, Φ, Cam,
      LogicStep, Resolve, ResStep, RandStep, Step, G0⟩
```

---

（必要であれば、さらに agent 用タグ構造・API 的アクセス方法も追記可能）
