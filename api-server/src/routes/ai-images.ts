import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/generate", async (req,res)=>{

try{

const {
prompt,
negativePrompt,
style,
variants=4,
referenceImage
}=req.body;

const styles:any = {
cinematic:"epic cinematic unreal engine 5",
horror:"dark horror photoreal",
cyberpunk:"neon cyberpunk movie scene",
superhero:"AAA superhero game render"
};

const finalPrompt = `
${prompt},
${styles[style]},
character consistency,
same hero identity in every variation,
ultra detailed 8k masterpiece
`;

const response = await axios.post(
"https://api.replicate.com/v1/predictions",
{
version:"black-forest-labs/flux-schnell",

input:{
prompt: finalPrompt,
negative_prompt: negativePrompt,
num_outputs: variants
}
},
{
headers:{
Authorization:`Token ${process.env.REPLICATE_API_TOKEN}`,
"Content-Type":"application/json"
}
}
);

res.json({
images: response.data.output || [],
raw: response.data
});

}catch(error){
console.error(error);
res.status(500).json({
error:"Generation failed"
});
}

});

export default router;
