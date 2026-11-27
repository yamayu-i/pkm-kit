## 変更の要約

- ボードの routine のカードにホバーすると出る status のボタンを、open なら closed と canceled の 2 つにした（ADR-0240）。closed / canceled の routine は、今までどおり ↩ で open に戻す。Closing の画面の routine の行も同じ
- ボードの Routines 欄と、Closing の画面の Closing routines の節で、closed / canceled の routine を既定で隠すようにした。末尾の「Show N done」で出し、「Hide done」で隠す。開いたかは覚えない
- 子への影響: 移行なし（画面だけの変更。データは変わらない）
