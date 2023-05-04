// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  
    const tokenId = req.query.tokenId;

    const name = `SpiderVerse #${tokenId}`;
    const description = "This is your Ticket to SpiderVerse";
    const image = `https://raw.githubusercontent.com/srb1998/spiderverse-nft/main/my-app/public/spiderverse/${tokenId}.svg`;


    return res.json({
        name:name,
        description: description,
        image: image,
    });

}
