export function getSpaceStatus(vmetaout) {
  if (vmetaout.action == "BID" && !vmetaout.claim_height) {
    return "pre-auction"
  } else if (vmetaout.action == "ROLLOUT") {
    return "rollout"
  } else if (vmetaout.action == "BID" && vmetaout.claim_height) {
    return "auctioned"
  } else if (vmetaout.action == "TRANSFER") {
    return "registered"
  } else if (vmetaout.action == "REVOKE") {
    return "revoked"
  }

}

export  function computeTimeline(vmetaout: Vmetaout, currentHeight: number): SpaceTimelineEvent[] {
    const blockTimeInSeconds = 600; // 10 minutes per block
    const status = vmetaout?.action;
    const claimHeight = vmetaout?.claim_height;
    const expireHeight = vmetaout?.expire_height;

    //bid without claim height => pre-auction, nomination for rollout
    //rollout => rolled out
    //bid with claim height => auction is on going
    //register => registered
    //revoke => revoked

    return [
      {
        name: "Open",
        description: "Submit an open transaction to propose the space for auction",
        done: !['REVOKE', 'OPEN'].includes(status),
        current: status === 'OPEN'
      },
      {
        name: "Pre-auction",
        description: "Top 10 highest-bid spaces advance to auctions daily",
        done: status === 'BID' && claimHeight || ['TRANSFER', 'ROLLOUT'].includes(status),
        current: status === 'RESERVE' || status === 'BID' && !claimHeight
      },
      {
        name: "In Auction",
        description: claimHeight ?
          `Auction last block: #${claimHeight-1}` :
          "Awaiting auction start",
        done: status === 'TRANSFER',
        current: status === 'ROLLOUT' || status === 'BID' && claimHeight,
        estimatedTime: (status === 'BID' && claimHeight) ? 
            ((claimHeight - currentHeight) > 0 
                ? (claimHeight - currentHeight) * blockTimeInSeconds 
                : undefined) 
        : undefined
      },
      {
        name: "Awaiting claim",
        description: "Winner must claim within the claim period",
        done: status == 'TRANSFER',
        current: status === 'BID' && claimHeight && claimHeight <= currentHeight,
        /* current: status === 'BID' && claimHeight && claimHeight <= currentHeight, */
        elapsedTime: (status === 'BID' && claimHeight && claimHeight <= currentHeight) ?
          (currentHeight - claimHeight) * blockTimeInSeconds :
          undefined
      },
      {
        name: "Registered",
        description: expireHeight ?  `Registration expires at block #${expireHeight}` : "Space is registered",
        done: status === 'TRANSFER',
        current: status === 'TRANSFER',
        estimatedTime: (expireHeight && ['TRANSFER', 'ROLLOUT'].includes(status)) ?
          (expireHeight - currentHeight) * blockTimeInSeconds : undefined
      }
    ];
  }

