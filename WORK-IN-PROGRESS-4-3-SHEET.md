# Work in progress — Physics 4.3 learning sheet

The complete worksheet was authored and locally QA-tested before the execution environment became unavailable during upload. This branch is an incomplete recovery checkpoint, not a releasable change. Do not merge or deploy it: 28 referenced assets still need to be restored/uploaded.

Original worktree: `/workspace/scratch/f17ef566f8a5/equilibrium43-sheet`.
Original branch: `codex/physics-4-3-learning-sheet-20261027`.
Base commit: `b0a9056c3771fddc42749e7537fc7d5888110f62`.
Expected complete tested tree (35 files, without this checkpoint): `e58af5b161c2e9ac287e18932712313d5dcb1489`.

The full TH/EN worksheet, QA report, source mapping, two bridge-task SVGs and one original figure are preserved here. The pre-upload local results were 365 unit tests passing, routes/build passing, and all four central A4 editions at 35 pages with 67 questions, 79 slots and 31 images per language. The current incomplete branch does not reproduce those passing image/build results.

Resume by recovering the existing worktree if available. Upload the missing blobs below, verify the complete tree equals the expected tested tree, remove this checkpoint, then create a draft PR. If files are unavailable, recrop/redraw according to SOURCES.md and rerun visual and print QA before opening a complete PR.

## Missing files

| Path | Git blob SHA | Bytes |
| --- | --- | --- |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-friction-knot.png` | `c25625ca48b853dac2e8b08f670a8ba0c039f95c` | 39543 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-incline-pulley.png` | `775e0f8b1b4e046c65c87191103e7da3f51730d1` | 79381 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-kite.png` | `75a80e786fe71677afb44991d4e71f908f4e0eb6` | 70011 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-pull-incline.png` | `cee4340018f225505740a52933ce5011ebabcdad` | 53526 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-push-box.png` | `94da46c81fc4a1450861829bc9ded2842b3f1520` | 30319 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-rope-limit.png` | `4272550fb5d3f25829ffadefc8eecac053f61925` | 27339 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/chapter-third-force.png` | `17590158660473919a442fdf4d6b7e7e183c86bf` | 42370 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/cosine-height.svg` | `e7a2c2e2ae42c19d3cb06652e4b04d77421a2044` | 2821 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/example-incline.png` | `79bc2b20632c2088393323b0f6405a199c4d4e93` | 79416 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/example-one-rope.png` | `2d4ff7517a59d9d905137ff098886d2850ec10f4` | 55017 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/example-traffic-light.png` | `e4c629fc5887df18182569d1cdf7112eb9a5b38f` | 79880 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/exercise-knot.png` | `9b24a55e6f02e487d33eb5ac5b238ca470ab96fb` | 31978 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/exercise-raised-mass.png` | `c31f32ad3e6540c6bee53791dbdedbc87a20848f` | 62716 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/exercise-third-force.png` | `5e0eef692d04049a62a2888613b73258d219754b` | 36451 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/experiment-apparatus.png` | `636da81e9f9a99cc2de1711f78a49e4ce0cf7747` | 688579 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/force-components.svg` | `0a305f196706c7a08785337f8ed1286faf22ab14` | 4128 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/four-force-result.svg` | `f6138cbb570f42b5f3c02ec15a0d4c8bbdfe4cc2` | 3214 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/horizontal-pulley.svg` | `5b419f16bd9cab4ba5f590aa32691fd328cf74cc` | 2423 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/incline-force-components.svg` | `1da3a433279b251e8dec23b2df98cf14405ac008` | 3075 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/incline-up-down.svg` | `ede00164cd320db54ebaa161a1eee4d604800e7b` | 4531 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/normal-force-press.svg` | `a8c65005f1968ff7840099d1727a015a589428eb` | 2945 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/rest-and-motion.svg` | `c959234f604fe4ba8113b78fba8e68c4687675df` | 3275 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/ropes-vertical-angles.svg` | `40b9727de52c753286ba96af1d6be8cbf0fd6812` | 2969 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/smooth-wall-floor.svg` | `8c63a16ab15ab0703141a4709029fa341ad443cf` | 2284 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/symmetric-ropes.svg` | `7a5e00d6b8a0f5ed697460466b47e2b4fd156475` | 4428 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/thought-two-ropes.png` | `4cd2cee78c8921a3c9988c1003cb91b310f2ff99` | 49466 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/three-force-result.svg` | `ab5961d857a9c690920d78e0c4ee8928a68d1742` | 2853 |
| `public/content/physics/ipst/equilibrium/assets/4-3-sheet/trig-triangle.svg` | `472cdec1b37dd95d8bbd2efb5de9a8ed84b24936` | 2647 |
