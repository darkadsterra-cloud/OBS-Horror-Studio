import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/generate", async(req,res)=>{
try{

const {
prompt,
negativePrompt,
style,
variants=4
}=req.body;

const styles:any={
cinematic:"epic cinematic unreal engine 5",
horror:"dark horror photoreal",
cyberpunk:"neon cyberpunk movie scene",
superhero:"AAA superhero game render"
};

const fullPrompt=`
${prompt}
${styles[style]}
ultra detailed 8k masterpiece
`;

const r=await axios.post(
"https://api.replicate.com/v1/predictions",
{
version:"black-forest-labs/flux-schnell",
input:{
prompt:fullPrompt,
negative_prompt:negativePrompt,
num_outputs:variants
}
},
{
headers:{
Authorization:`Token ${process.env.REPLICATE_API_TOKEN}`
}
}
);

res.json(r.data);

}catch(e){
res.status(500).json({error:"failed"});
}
});

export default router;
