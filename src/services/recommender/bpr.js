import { createRng } from '../../utils/random';

// Bayesian Personalised Ranking matrix factorisation (Rendle et al., 2009)
// trained with SGD on implicit borrow events.
export function trainBPR(history, nItems, opts = {}) {
  const { factors = 16, epochs = 60, lr = 0.05, reg = 0.01, seed = 7 } = opts;
  const R = createRng(seed);
  const nUsers = history.length;
  const init = () => Float64Array.from({ length: factors }, () => R.normal() * 0.1);
  const P = Array.from({ length: nUsers }, init);
  const Q = Array.from({ length: nItems }, init);
  const bias = new Float64Array(nItems);
  const pairs = [];
  history.forEach((set, u) => set.forEach((i) => pairs.push([u, i])));
  const losses = [];
  if (!pairs.length) return { P, Q, bias, factors, losses, pairs: 0 };

  for (let e = 0; e < epochs; e++) {
    let loss = 0;
    for (let s = 0; s < pairs.length; s++) {
      const [u, i] = pairs[Math.floor(R.next() * pairs.length)];
      let j = Math.floor(R.next() * nItems);
      let guard = 0;
      while (history[u].has(j) && guard++ < 20) j = Math.floor(R.next() * nItems);
      const pu = P[u];
      const qi = Q[i];
      const qj = Q[j];
      let x = bias[i] - bias[j];
      for (let f = 0; f < factors; f++) x += pu[f] * (qi[f] - qj[f]);
      const sig = 1 / (1 + Math.exp(x)); // d/dx of -ln(sigmoid(x))
      loss += Math.log(1 + Math.exp(-x));
      bias[i] += lr * (sig - reg * bias[i]);
      bias[j] += lr * (-sig - reg * bias[j]);
      for (let f = 0; f < factors; f++) {
        const p = pu[f];
        pu[f] += lr * (sig * (qi[f] - qj[f]) - reg * p);
        qi[f] += lr * (sig * p - reg * qi[f]);
        qj[f] += lr * (-sig * p - reg * qj[f]);
      }
    }
    if (e % 10 === 0 || e === epochs - 1) losses.push({ epoch: e + 1, loss: loss / pairs.length });
  }
  return { P, Q, bias, factors, losses, pairs: pairs.length };
}

export function bprScore(model, pu, j) {
  const q = model.Q[j];
  let s = model.bias[j];
  for (let f = 0; f < model.factors; f++) s += pu[f] * q[f];
  return s;
}

// Cold-start fold-in: a user with no borrowing history gets the
// similarity-weighted average of similar students' latent vectors.
export function foldIn(model, weights) {
  const v = new Float64Array(model.factors);
  let tot = 0;
  weights.forEach(([u, w]) => {
    if (w <= 0) return;
    tot += w;
    for (let f = 0; f < model.factors; f++) v[f] += w * model.P[u][f];
  });
  if (tot) for (let f = 0; f < model.factors; f++) v[f] /= tot;
  return v;
}
