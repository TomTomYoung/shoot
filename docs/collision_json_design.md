# 衝突判定JSON化設計案

## 概要
現在ハードコーディングされている衝突判定ロジックをJSON設定化する設計案。

## 設計方針

### Phase 1: パラメータのJSON化 ✅（実装済み）
- 衝突半径（radius）
- 地形設定（Terrain）
- グリッド設定（grid）

### Phase 2: 衝突ルールのJSON化（提案）

#### 1. 衝突グループ定義
```json
{
  "CollisionGroups": {
    "player": {
      "types": ["PLAYER"],
      "defaultRadius": 4
    },
    "playerBullets": {
      "types": ["P_BULLET"],
      "defaultRadius": 5
    },
    "enemies": {
      "types": ["ENEMY"],
      "defaultRadius": 10
    },
    "enemyBullets": {
      "types": ["E_BULLET"],
      "defaultRadius": 5
    },
    "bosses": {
      "types": ["BOSS"],
      "defaultRadius": 50
    },
    "collectibles": {
      "types": ["ITEM", "POWER_UP"],
      "defaultRadius": 8
    },
    "terrain": {
      "types": ["TERRAIN"],
      "method": "noise"
    }
  }
}
```

#### 2. 衝突マトリクス定義
```json
{
  "CollisionRules": [
    {
      "id": "player_collect_items",
      "groupA": "player",
      "groupB": "collectibles",
      "method": "circle",
      "radiusBuffer": 10,
      "onCollision": "collectItem",
      "destroyA": false,
      "destroyB": true
    },
    {
      "id": "player_hit_by_hazards",
      "groupA": "player",
      "groupB": ["enemies", "enemyBullets"],
      "method": "circle",
      "radiusBuffer": 0,
      "onCollision": "playerHit",
      "destroyA": false,
      "destroyB": false
    },
    {
      "id": "bullet_vs_enemy",
      "groupA": "playerBullets",
      "groupB": "enemies",
      "method": "circle",
      "radiusBuffer": 0,
      "onCollision": "damageEnemy",
      "destroyA": true,
      "destroyB": false
    },
    {
      "id": "bullet_vs_boss",
      "groupA": "playerBullets",
      "groupB": "bosses",
      "method": "grid",
      "onCollision": "resolveBossHit",
      "destroyA": true,
      "destroyB": false
    },
    {
      "id": "entity_vs_terrain",
      "groupA": ["player", "playerBullets"],
      "groupB": "terrain",
      "method": "noise",
      "onCollision": "terrainHit"
    }
  ]
}
```

#### 3. コールバック定義
```json
{
  "CollisionCallbacks": {
    "collectItem": {
      "code": `
        b.active = false;
        ctx.collectItem(b);
      `
    },
    "playerHit": {
      "code": `
        ctx.playerHit();
      `
    },
    "damageEnemy": {
      "code": `
        b.hp--;
        a.active = false;
        ctx.spawnParticle(b.world.x, b.world.y, '#fff');
        if (b.hp <= 0) {
          b.active = false;
          ctx.spawnExplosion(b.world.x, b.world.y);
          ctx.addScore(b.score || 100);
          ctx.trySpawnItem(b.world.x, b.world.y);
        }
      `
    },
    "resolveBossHit": {
      "code": `
        if (ctx.resolveBossHit(b, a)) {
          a.active = false;
        }
      `
    },
    "terrainHit": {
      "code": `
        a.active = false;
        ctx.spawnParticle(a.world.x, a.world.y, '#888', 2);
      `
    }
  }
}
```

## 実装例

### エンジン側の実装
```javascript
class CollisionEngine {
  constructor(config) {
    this.groups = config.CollisionGroups;
    this.rules = config.CollisionRules;
    this.callbacks = {};

    // コールバックをコンパイル
    for (let [name, def] of Object.entries(config.CollisionCallbacks)) {
      this.callbacks[name] = new Function('a', 'b', 'ctx', def.code);
    }
  }

  checkCollisions(entities, context) {
    for (let rule of this.rules) {
      const groupA = this.getEntitiesByGroup(entities, rule.groupA);
      const groupB = this.getEntitiesByGroup(entities, rule.groupB);

      for (let a of groupA) {
        for (let b of groupB) {
          if (this.testCollision(a, b, rule)) {
            this.callbacks[rule.onCollision](a, b, context);
            if (rule.destroyA) a.active = false;
            if (rule.destroyB) b.active = false;
          }
        }
      }
    }
  }

  testCollision(a, b, rule) {
    switch (rule.method) {
      case 'circle':
        return this.circleCollision(a, b, rule.radiusBuffer || 0);
      case 'grid':
        return this.gridCollision(a, b);
      case 'noise':
        return this.noiseCollision(a, b);
      default:
        return false;
    }
  }

  circleCollision(a, b, buffer) {
    const dx = a.world.x - b.world.x;
    const dy = a.world.y - b.world.y;
    const r = (a.radius || 5) + (b.radius || 5) + buffer;
    return dx * dx + dy * dy < r * r;
  }

  gridCollision(a, b) {
    // ボスグリッド判定の実装
    // ...
  }

  noiseCollision(a, b) {
    // 地形判定の実装
    // ...
  }

  getEntitiesByGroup(entities, groupName) {
    if (Array.isArray(groupName)) {
      return entities.filter(e =>
        groupName.some(g => this.groups[g].types.includes(e.type))
      );
    }
    const group = this.groups[groupName];
    return entities.filter(e => group.types.includes(e.type));
  }
}
```

### 使用例
```javascript
// ゲームループ内
const collisionConfig = GameData.Library.CollisionConfig;
const collisionEngine = new CollisionEngine(collisionConfig);

function gameLoop() {
  // ...
  collisionEngine.checkCollisions(ENTITIES, GAME_CONTEXT);
  // ...
}
```

## メリット

1. **柔軟性**: ゲームバランス調整がコード変更なしで可能
2. **可読性**: 衝突ルールが一箇所にまとまる
3. **拡張性**: 新しい衝突タイプを簡単に追加可能
4. **デバッグ**: 衝突判定のON/OFF切り替えが容易

## デメリット

1. **パフォーマンス**: ループが増えて若干遅くなる可能性
2. **複雑性**: 設定ファイルが大きくなる
3. **動的コード**: セキュリティリスク（制御された環境では問題なし）

## 段階的導入プラン

1. **Phase 1**: 衝突グループの定義（1-2時間）
2. **Phase 2**: 衝突マトリクスの実装（2-3時間）
3. **Phase 3**: コールバックの動的実行（1-2時間）
4. **Phase 4**: 既存コードからの移行（2-3時間）
5. **Phase 5**: テストと最適化（1-2時間）

合計: 7-12時間程度の作業量

## 参考実装

類似のゲームエンジンでの実装例：
- Unity: Collision Matrix（Layer Collision Matrix）
- Phaser: Arcade Physics Collision Groups
- Matter.js: Collision Filtering
