export const quoterAbiMin = [
  { 
    name: "quoteExactInputSingle", 
    type: "function", 
    stateMutability: "view", 
    inputs: [{ 
      type: "tuple", 
      components: [
        { name: "tokenIn", type: "address" }, 
        { name: "tokenOut", type: "address" }, 
        { name: "amountIn", type: "uint256" }, 
        { name: "fee", type: "uint24" }, 
        { name: "sqrtPriceLimitX96", type: "uint160" }
      ] 
    }], 
    outputs: [{ name: "amountOut", type: "uint256" }] 
  },
] as const;

export const permit2AbiMin = [
  { 
    name: "permit", 
    type: "function", 
    inputs: [
      { type: "address" }, 
      { 
        type: "tuple[]", 
        components: [
          { 
            name: "details", 
            type: "tuple", 
            components: [
              { name: "token", type: "address" }, 
              { name: "amount", type: "uint160" }, 
              { name: "expiration", type: "uint48" }, 
              { name: "nonce", type: "uint48" }
            ] 
          }, 
          { name: "spender", type: "address" }, 
          { name: "sigDeadline", type: "uint256" }
        ] 
      }, 
      { type: "bytes" }
    ], 
    outputs: [] 
  },
  { 
    name: "transferFrom", 
    type: "function", 
    inputs: [
      { type: "address" }, 
      { type: "address" }, 
      { type: "uint160" }, 
      { type: "address" }
    ], 
    outputs: [] 
  },
  { 
    name: "nonceBitmap", 
    type: "function", 
    stateMutability: "view", 
    inputs: [
      { type: "address" }, 
      { type: "uint256" }
    ], 
    outputs: [{ type: "uint256" }] 
  },
] as const;

export const uniswapRouterAbi = [
  { 
    name: "exactInputSingle", 
    type: "function", 
    inputs: [{ 
      type: "tuple", 
      components: [
        { name: "tokenIn", type: "address" }, 
        { name: "tokenOut", type: "address" }, 
        { name: "fee", type: "uint24" }, 
        { name: "recipient", type: "address" }, 
        { name: "amountIn", type: "uint256" }, 
        { name: "amountOutMinimum", type: "uint256" }, 
        { name: "sqrtPriceLimitX96", type: "uint160" }
      ] 
    }], 
    outputs: [{ type: "uint256" }] 
  },
] as const;
