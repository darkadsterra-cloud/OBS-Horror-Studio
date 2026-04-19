import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, Zap, Wind, Mic } from 'lucide-react';

interface SoundLibraryProps {
  activeSounds: string[];
  onToggleSound: (id: string) => void;
  masterVolume: number;
  onVolumeChange: (v: number) => void;
}

const BASE = 'https://raw.githubusercontent.com/darkadsterra-cloud/CreepyZoneStore/main/artifacts/horror-animation-studio/artifacts/horror-animator/public/sounds/';

interface SoundEntry {
  id: string;
  name: string;
  description: string;
  category: 'ambient' | 'effect' | 'music' | 'voice';
  file: string;
}

const ALL_SOUNDS: SoundEntry[] = [
  { id: 'deep-drone', name: 'Deep Drone', description: 'Low rumbling subsonic drone', category: 'ambient', file: 'soundreality-horror-rumble-winds-253834.mp3' },
  { id: 'wind-howl', name: 'Wind Howl', description: 'Haunted howling wind', category: 'ambient', file: 'soundreality-horror-rumble-winds-253834.mp3' },
  { id: 'thunder-rumble', name: 'Thunder Rumble', description: 'Distant rolling thunder', category: 'ambient', file: 'soundreality-horror-kick-247743.mp3' },
  { id: 'thunderstorm', name: 'Thunderstorm', description: 'Full thunderstorm with rain', category: 'ambient', file: 'jorisvermeer-horror-background-atmosphere-030-394196.mp3' },
  { id: 'heavy-rain', name: 'Heavy Rain', description: 'Torrential horror rain storm', category: 'ambient', file: 'jorisvermeer-horror-background-atmosphere-030-394196.mp3' },
  { id: 'haunted-room', name: 'Haunted Room', description: 'Creaking haunted house', category: 'ambient', file: 'universfield-horror-background-atmosphere-156462.mp3' },
  { id: 'void-hum', name: 'Void Hum', description: 'Infinite void resonance', category: 'ambient', file: 'universfield-dark-horror-soundscape-345814.mp3' },
  { id: 'ritual-chant', name: 'Ritual Chant', description: 'Demonic ritual chanting', category: 'ambient', file: 'phatphrogstudio-demon-spirit-angry-chanting-no-ai-479754.mp3' },
  { id: 'horror-bg-01', name: 'Horror Ambience 01', description: 'Dark horror atmosphere', category: 'ambient', file: 'freesound_community-horror-ambience-01-66708.mp3' },
  { id: 'horror-bg-026', name: 'Horror Background 026', description: 'Suspense background', category: 'ambient', file: 'universfield-horror-background-atmosphere-026-30-352879.mp3' },
  { id: 'horror-bg-06', name: 'Horror Background 06', description: 'Eerie background', category: 'ambient', file: 'universfield-horror-background-atmosphere-06-199279.mp3' },
  { id: 'horror-bg-08', name: 'Horror Background 08', description: 'Dark background', category: 'ambient', file: 'universfield-horror-background-atmosphere-08-215794.mp3' },
  { id: 'horror-bg-09', name: 'Horror Background 09', description: 'Horror background 09', category: 'ambient', file: 'universfield-horror-background-atmosphere-09-219111.mp3' },
  { id: 'horror-suspense', name: 'Horror Suspense BG', description: 'Suspense horror background', category: 'ambient', file: 'universfield-horror-background-atmosphere-for-suspense-166944.mp3' },
  { id: 'scary-atmosphere', name: 'Scary Atmosphere', description: 'Scary horror atmosphere', category: 'ambient', file: 'universfield-scary-horror-atmosphere-176754.mp3' },
  { id: 'dark-soundscape', name: 'Dark Soundscape', description: 'Dark horror soundscape', category: 'ambient', file: 'universfield-dark-horror-soundscape-345814.mp3' },
  { id: 'dark-suspense-30s', name: 'Dark Suspense 30s', description: 'Dark horror suspense', category: 'ambient', file: 'universfield-dark-horror-suspense-30s-355836.mp3' },
  { id: 'tense-paranormal', name: 'Tense Paranormal', description: 'Tense paranormal horror', category: 'ambient', file: 'universfield-tense-paranormal-horror-15s-498138.mp3' },
  { id: 'tense-cinematic', name: 'Tense Cinematic', description: 'Cinematic paranormal horror', category: 'ambient', file: 'universfield-tense-paranormal-horror-cinematic-15s-498207.mp3' },
  { id: 'ghosts-on-film', name: 'Ghosts on Film', description: 'Ghost film atmosphere', category: 'ambient', file: 'universfield-ghosts-on-film-185898.mp3' },
  { id: 'horror-rumble', name: 'Horror Rumble Winds', description: 'Rumbling horror winds', category: 'ambient', file: 'soundreality-horror-rumble-winds-253834.mp3' },
  { id: 'horror-pad-crowd', name: 'Horror Pad Crowd', description: 'Horror pad pitch crowd', category: 'ambient', file: 'soundreality-horror-pad-pitch-crowd-391598.mp3' },
  { id: 'flesh-horror', name: 'Flesh Growing Horror', description: 'Flesh growing horror sound', category: 'ambient', file: 'tanweraman-flesh-growing-horror-392360.mp3' },

  { id: 'heartbeat', name: 'Heartbeat', description: 'Slow creepy heartbeat', category: 'effect', file: 'soundreality-horror-kick-247743.mp3' },
  { id: 'door-creak', name: 'Door Creak', description: 'Old door slowly creaking', category: 'effect', file: 'simplesound-dark-horror-opener-443328.mp3' },
  { id: 'chains', name: 'Chains Rattling', description: 'Metal chains clanking', category: 'effect', file: 'alex_kizenkov-horror-hit-logo-142395.mp3' },
  { id: 'church-bell', name: 'Funeral Bell', description: 'Slow tolling death bell', category: 'effect', file: 'simplesound-horror-piano-443326.mp3' },
  { id: 'demon-roar', name: 'Demon Roar', description: 'Full demon roar explosion', category: 'effect', file: 'dragon-studio-deep-guttural-growl-472380.mp3' },
  { id: 'electric-zap', name: 'Electric Zap', description: 'Electric shock zap burst', category: 'effect', file: 'alex_kizenkov-horror-hit-logo-142395.mp3' },
  { id: 'jumpscare-sting', name: 'Jumpscare Sting', description: 'Hollywood jumpscare hit', category: 'effect', file: 'freesound_community-echo-jumpscare-80933.mp3' },
  { id: 'evil-laugh-sfx', name: 'Evil Laugh SFX', description: 'Short evil laugh burst', category: 'effect', file: 'freesound_community-mocking-demon-laugh-growl-86811.mp3' },
  { id: 'death-rattle', name: 'Death Rattle', description: 'Final death rattle breath', category: 'effect', file: 'freesound_community-echoed-screams-103515.mp3' },
  { id: 'echo-jumpscare', name: 'Echo Jumpscare', description: 'Echo jumpscare hit', category: 'effect', file: 'freesound_community-echo-jumpscare-80933.mp3' },
  { id: 'echoed-screams', name: 'Echoed Screams', description: 'Multiple echoed screams', category: 'effect', file: 'freesound_community-echoed-screams-103515.mp3' },
  { id: 'monster-roar', name: 'Monster Roar', description: 'Full monster roar', category: 'effect', file: 'freesound_community-monster-roar-02-102957.mp3' },
  { id: 'monster-growls', name: 'Monster Growls', description: 'Deep monster growls', category: 'effect', file: 'freesound_community-monster-growls-70784.mp3' },
  { id: 'demonic-roar', name: 'Demonic Roar', description: 'Full demonic roar', category: 'effect', file: 'freesound_community-demonic-roar-40349.mp3' },
  { id: 'demon-haunting', name: 'Demon Haunting', description: 'Scary demon haunting', category: 'effect', file: 'freesound_community-033203_scary-demon-haunting-sound-76189.mp3' },
  { id: 'mocking-demon', name: 'Mocking Demon Laugh', description: 'Demon laughing growl', category: 'effect', file: 'freesound_community-mocking-demon-laugh-growl-86811.mp3' },
  { id: 'horror-hit', name: 'Horror Hit Logo', description: 'Horror hit logo sting', category: 'effect', file: 'alex_kizenkov-horror-hit-logo-142395.mp3' },
  { id: 'braam-dark', name: 'Braam Dark Impact', description: 'Biodynamic dark braam', category: 'effect', file: 'bryansantosbreton-biodynamic-impact-braam-tonal-dark-176441.mp3' },
  { id: 'horror-kick', name: 'Horror Kick', description: 'Horror kick impact', category: 'effect', file: 'soundreality-horror-kick-247743.mp3' },
  { id: 'horror-temptation', name: 'Horror Temptation', description: 'Horror temptation sting', category: 'effect', file: 'soundreality-horror-temptation-249034.mp3' },
  { id: 'horror-action', name: 'Horror Thriller Action', description: 'Horror thriller action', category: 'effect', file: 'soundreality-horror-thriller-action-247745.mp3' },
  { id: 'dinosaur-growls', name: 'Dinosaur Growls', description: 'Massive dinosaur growls', category: 'effect', file: 'gsmsea-dinosaur-growls-431298.mp3' },
  { id: 'monster-noise', name: 'Monster Noise', description: 'Deep monster noise', category: 'effect', file: 'alex_jauk-monster-noise-256448.mp3' },
  { id: 'monstrous-scream', name: 'Monstrous Scream', description: 'Full monstrous scream', category: 'effect', file: 'alex_jauk-monstrous-scream-187949.mp3' },
  { id: 'creepy-growling', name: 'Creepy Growling', description: 'Creepy monster growling', category: 'effect', file: 'dragon-studio-creepy-growling-sfx-472368.mp3' },
  { id: 'deep-guttural', name: 'Deep Guttural Growl', description: 'Deep guttural growl', category: 'effect', file: 'dragon-studio-deep-guttural-growl-472380.mp3' },
  { id: 'beast-growl', name: 'Beast Growl', description: 'Growl of the beast', category: 'effect', file: 'dragon-studio-growl-of-the-beast-504021.mp3' },
  { id: 'monster-growl', name: 'Monster Growl', description: 'Monster growl sound', category: 'effect', file: 'dragon-studio-monster-growl-390285.mp3' },
  { id: 't-rex-growl', name: 'T-Rex Growl', description: 'T-Rex dinosaur growl', category: 'effect', file: 'dragon-studio-t-rex-growl-324746.mp3' },
  { id: 'werewolf-growl', name: 'Werewolf Growl', description: 'Werewolf monster growl', category: 'effect', file: 'dragon-studio-werewolf-growl-511303.mp3' },
  { id: 'thunder-dragon', name: 'Thunder Dragon Roar', description: 'Thunder dragon voice roar', category: 'effect', file: 'phatphrogstudio-thunder-dragon-voice-roar-478143.mp3' },
  { id: 'dragon-growl', name: 'Dragon Growl', description: 'Dragon voice growl', category: 'effect', file: 'phatphrogstudio-dragon-voice-growl-496281.mp3' },
  { id: 'evil-roar', name: 'Evil Roar', description: 'Evil roar sound', category: 'effect', file: 'kunal_acharjee-evil-roar-271402.mp3' },
  { id: 'dark-horror-opener', name: 'Dark Horror Opener', description: 'Dark horror opener sting', category: 'effect', file: 'simplesound-dark-horror-opener-443328.mp3' },

  { id: 'dark-piano', name: 'Dark Piano Melody', description: 'Haunting minor key piano', category: 'music', file: 'simplesound-horror-piano-443326.mp3' },
  { id: 'horror-strings', name: 'Horror Strings', description: 'Tense orchestral strings', category: 'music', file: 'simplesound-horror-trailer-443327.mp3' },
  { id: 'music-box', name: 'Broken Music Box', description: 'Warped music box tune', category: 'music', file: 'universfield-scary-music-box-165983.mp3' },
  { id: 'organ-drone', name: 'Gothic Organ', description: 'Dark cathedral organ drone', category: 'music', file: 'universfield-dark-horror-soundscape-345814.mp3' },
  { id: 'violin-shriek', name: 'Violin Shriek', description: 'Screeching horror violin', category: 'music', file: 'soundreality-horror-thriller-action-247745.mp3' },
  { id: 'choir-dark', name: 'Dark Choir', description: 'Demonic choral voices', category: 'music', file: 'phatphrogstudio-demon-spirit-angry-chanting-no-ai-479754.mp3' },
  { id: 'synth-horror', name: 'Synth Horror', description: '80s horror synth atmosphere', category: 'music', file: 'universfield-tense-paranormal-horror-15s-498138.mp3' },
  { id: 'horror-piano', name: 'Horror Piano', description: 'Simple horror piano', category: 'music', file: 'simplesound-horror-piano-443326.mp3' },
  { id: 'horror-trailer', name: 'Horror Trailer', description: 'Horror trailer music', category: 'music', file: 'simplesound-horror-trailer-443327.mp3' },
  { id: 'intense-horror', name: 'Intense Horror Music', description: 'Intense horror music', category: 'music', file: 'freesound_community-intense-horror-music-01-14890.mp3' },
  { id: 'scary-music-box', name: 'Scary Music Box', description: 'Scary music box melody', category: 'music', file: 'universfield-scary-music-box-165983.mp3' },
  { id: 'cosmic-oblivion', name: 'Cosmic Oblivion', description: 'Neon nexus cosmic music', category: 'music', file: 'phatphrogstudio-cosmic-oblivion-neon-nexus-477911.mp3' },
  { id: 'cyber-attack', name: 'Cyber Attack', description: 'Datastorm rebellion music', category: 'music', file: 'phatphrogstudio-cyber-attack-datastorm-rebellion-477469.mp3' },
  { id: 'infinite-expanse', name: 'Infinite Expanse', description: 'Piano nova trails music', category: 'music', file: 'phatphrogstudio-infinite-expanse-piano-nova-trails-477471.mp3' },
  { id: 'internal-fury', name: 'Internal Fury', description: 'Fury dance horror music', category: 'music', file: 'phatphrogstudio-internal-fury-furyx27s-dance-477470.mp3' },
  { id: 'plagued-bastion', name: 'Plagued Bastion', description: 'Survival undead haven', category: 'music', file: 'phatphrogstudio-plagued-bastion-survival-undead-haven-477915.mp3' },
  { id: 'pyro-witch', name: 'Pyro Witch', description: 'Fireborn saga action music', category: 'music', file: 'phatphrogstudio-pyro-witch-fireborn-saga-royalty-free-action-music-502322.mp3' },
  { id: 'creaking-cradle', name: 'Creaking Cradle', description: 'Nameless flesh music', category: 'music', file: 'phatphrogstudio-creaking-cradle-nameless-flesh-477965.mp3' },
  { id: 'horror-flashbacks', name: 'Horror Voice Flashbacks', description: 'Horror voice flashback music', category: 'music', file: 'freesound_community-horror-voice-flashbacks-14469.mp3' },
  { id: 'screams-agony', name: 'Screams of Agony', description: 'Screams of agony track', category: 'music', file: 'soundreality-screams-of-agony-142447.mp3' },

  { id: 'scream', name: 'Terror Scream', description: 'Blood-curdling scream', category: 'voice', file: 'freesound_community-scream-85218.mp3' },
  { id: 'scream-female', name: 'Female Horror Scream', description: 'Hollywood female scream', category: 'voice', file: 'virtual_vibes-female-screaming-audio-hd-379382.mp3' },
  { id: 'growl', name: 'Demonic Growl', description: 'Deep demonic growl', category: 'voice', file: 'dragon-studio-creepy-growling-sfx-472368.mp3' },
  { id: 'laugh', name: 'Maniacal Laugh', description: 'Evil maniacal laughter', category: 'voice', file: 'freesound_community-mocking-demon-laugh-growl-86811.mp3' },
  { id: 'whisper', name: 'Demonic Whisper', description: 'Close demonic whisper', category: 'voice', file: 'phatphrogstudio-demon-spirit-voice-ghost-whispers-amp-muttering-496706.mp3' },
  { id: 'breathing', name: 'Heavy Breathing', description: 'Ragged heavy breathing', category: 'voice', file: 'freesound_community-scary-scream-3-81274.mp3' },
  { id: 'moan', name: 'Death Moan', description: 'Low death moan groan', category: 'voice', file: 'freesound_community-zombie-pain-1-95166.mp3' },
  { id: 'child-laugh', name: 'Ghost Child Laugh', description: 'Creepy child laughter', category: 'voice', file: 'phatphrogstudio-evil-doll-voice-creepy-laugh-477944.mp3' },
  { id: 'wail', name: 'Banshee Wail', description: 'Piercing banshee wail', category: 'voice', file: 'virtual_vibes-woman-scream-sound-hd-379381.mp3' },
  { id: 'possessed-scream', name: 'Possessed Scream', description: 'Exorcism possession scream', category: 'voice', file: 'freesound_community-terrifying-scream-32389.mp3' },
  { id: 'death-scream', name: 'Death Scream', description: 'Final death agony scream', category: 'voice', file: 'universfield-male-death-scream-horror-352706.mp3' },
  { id: 'demonic-woman', name: 'Demonic Woman Scream', description: 'Demonic woman scream', category: 'voice', file: 'freesound_community-demonic-woman-scream-6333.mp3' },
  { id: 'evil-shriek', name: 'Evil Shriek', description: 'Evil high shriek', category: 'voice', file: 'freesound_community-evil-shreik-45560.mp3' },
  { id: 'forest-monster', name: 'Forest Monster Scream', description: 'Forest monster scream', category: 'voice', file: 'freesound_community-forest-monster-scream1-104247.mp3' },
  { id: 'ghastly-groan', name: 'Ghastly Groan', description: 'Ghastly groaning sound', category: 'voice', file: 'freesound_community-ghastly-groan-48064.mp3' },
  { id: 'girl-scream-1', name: 'Girl Scream 1', description: 'Girl horror scream', category: 'voice', file: 'freesound_community-girl-scream-45657.mp3' },
  { id: 'girl-scream-2', name: 'Girl Scream 2', description: 'Girl horror scream 2', category: 'voice', file: 'freesound_community-girl-scream-83987.mp3' },
  { id: 'monster-screech', name: 'Monster Screech', description: 'High quality monster screech', category: 'voice', file: 'freesound_community-high-quality-monster-screech-65012.mp3' },
  { id: 'little-girl-scream', name: 'Little Girl Scream', description: 'Little girl screaming', category: 'voice', file: 'freesound_community-little-girl-screaming-101185.mp3' },
  { id: 'young-girl-scream', name: 'Young Girl Scream', description: 'Young girl scream', category: 'voice', file: 'freesound_community-young-girl-screaming-1-90519.mp3' },
  { id: 'multiple-screams', name: 'Multiple Female Screams', description: 'Multiple female screams', category: 'voice', file: 'freesound_community-multiple-female-screams-70786.mp3' },
  { id: 'scary-scream', name: 'Scary Scream', description: 'Scary scream burst', category: 'voice', file: 'freesound_community-scary-scream-3-81274.mp3' },
  { id: 'scream-1', name: 'Scream 1', description: 'Pure scream sound', category: 'voice', file: 'freesound_community-scream-85218.mp3' },
  { id: 'scream-2', name: 'Scream 2', description: 'Scream 2 sound', category: 'voice', file: 'freesound_community-scream-90747.mp3' },
  { id: 'scream-echo', name: 'Scream With Echo', description: 'Echoing scream', category: 'voice', file: 'freesound_community-scream-with-echo-46585.mp3' },
  { id: 'terrifying-scream', name: 'Terrifying Scream', description: 'Most terrifying scream', category: 'voice', file: 'freesound_community-terrifying-scream-32389.mp3' },
  { id: 'very-intense-hell', name: 'Very Intense Hell', description: 'Intense hell screaming', category: 'voice', file: 'freesound_community-very-intense-hell-72137.mp3' },
  { id: 'whispers-screams', name: 'Whispers & Screams', description: 'Whispers and screams mix', category: 'voice', file: 'freesound_community-whispers-and-screams-87177.mp3' },
  { id: 'zombie-growl', name: 'Zombie Growl', description: 'Zombie growl sound', category: 'voice', file: 'freesound_community-zombie-growl-3-6863.mp3' },
  { id: 'zombie-pain', name: 'Zombie Pain', description: 'Zombie pain moan', category: 'voice', file: 'freesound_community-zombie-pain-1-95166.mp3' },
  { id: 'zombie-roar', name: 'Zombie Roar', description: 'Zombie roar sound', category: 'voice', file: 'freesound_community-zombie-roar-104542.mp3' },
  { id: 'zombie-scream', name: 'Zombie Scream', description: 'Monster zombie scream', category: 'voice', file: 'freesound_community-monster-zombie-scream-105972.mp3' },
  { id: 'female-zombie', name: 'Female Zombie Screams', description: 'Female zombie screams', category: 'voice', file: 'dragon-studio-female-zombie-screams-324744.mp3' },
  { id: 'woman-screaming', name: 'Woman Screaming', description: 'Woman screaming SFX', category: 'voice', file: 'dragon-studio-woman-screaming-sfx-screaming-sound-effect-320169.mp3' },
  { id: 'zombie-screech', name: 'Zombie Screech', description: 'Zombie screech sound', category: 'voice', file: 'dragon-studio-zombie-screech-sound-effect-312865.mp3' },
  { id: 'scary-woman-scream', name: 'Scary Woman Scream', description: 'Ultra realistic woman scream', category: 'voice', file: 'virtual_vibes-scary-woman-scream-ultra-realistic-379378.mp3' },
  { id: 'woman-scream-hd', name: 'Woman Scream HD', description: 'HD woman scream', category: 'voice', file: 'virtual_vibes-woman-scream-sound-hd-379381.mp3' },
  { id: 'female-screaming-hd', name: 'Female Screaming HD', description: 'Female screaming audio HD', category: 'voice', file: 'virtual_vibes-female-screaming-audio-hd-379382.mp3' },
  { id: 'angry-man-yell', name: 'Angry Man Yell', description: 'Angry man yell HD', category: 'voice', file: 'virtual_vibes-angry-man-yell-sound-hd-379386.mp3' },
  { id: 'frantic-scream', name: 'Frantic Screaming', description: 'Frantic non-stop screaming', category: 'voice', file: 'phobiix-frantic-screaming-213549.mp3' },
  { id: 'scared-woman', name: 'Scared Woman Scream', description: 'Halloween scared woman', category: 'voice', file: 'scottishperson-sound-effect-halloween-scared-woman-scream-01-253233.mp3' },
  { id: 'male-death-scream', name: 'Male Death Scream', description: 'Male death scream horror', category: 'voice', file: 'universfield-male-death-scream-horror-352706.mp3' },
  { id: 'man-scream', name: 'Man Scream', description: 'Man scream 08', category: 'voice', file: 'universfield-man-scream-08-352438.mp3' },
  { id: 'demon-voice', name: 'Demon Voice', description: 'Haunted demon voice', category: 'voice', file: 'hauntedhouseentertainment-demon-voice-246555.mp3' },
  { id: 'demon-chanting', name: 'Demon Spirit Chanting', description: 'Demon spirit angry chanting', category: 'voice', file: 'phatphrogstudio-demon-spirit-angry-chanting-no-ai-479754.mp3' },
  { id: 'demon-whispers', name: 'Demon Spirit Whispers', description: 'Demon ghost whispers', category: 'voice', file: 'phatphrogstudio-demon-spirit-voice-ghost-whispers-amp-muttering-496706.mp3' },
  { id: 'demon-die', name: 'Demon Voice: Die', description: 'Demon voice saying die', category: 'voice', file: 'phatphrogstudio-demon-voice-die-488316.mp3' },
  { id: 'demon-growling', name: 'Demon Voice Growling', description: 'Demon voice growling', category: 'voice', file: 'phatphrogstudio-demon-voice-growling-503874.mp3' },
  { id: 'demon-no-mercy', name: 'Demon: No Mercy', description: 'Demon voice no mercy', category: 'voice', file: 'phatphrogstudio-demon-voice-no-mercy-477827.mp3' },
  { id: 'demon-no-running', name: 'Demon: No More Running', description: 'Demon no more running', category: 'voice', file: 'phatphrogstudio-demon-voice-no-more-running-480562.mp3' },
  { id: 'demon-smell-flesh', name: 'Demon: Smell Flesh', description: 'Demon smells flesh', category: 'voice', file: 'phatphrogstudio-demon-voice-smell-flesh-no-ai-479322.mp3' },
  { id: 'evil-doll-laugh', name: 'Evil Doll Laugh', description: 'Evil doll creepy laugh', category: 'voice', file: 'phatphrogstudio-evil-doll-voice-creepy-laugh-477944.mp3' },
  { id: 'lich-come-closer', name: 'Lich: Come Closer', description: 'Lich demon come closer', category: 'voice', file: 'phatphrogstudio-lich-demonic-voice-come-closer-502312.mp3' },
  { id: 'lich-i-sense-you', name: 'Lich: I Sense You', description: 'Lich demon I sense you', category: 'voice', file: 'phatphrogstudio-lich-demonic-voice-i-sense-you-490452.mp3' },
  { id: 'oni-laugh-1', name: 'Oni Demon Laugh', description: 'Oni demon laughter', category: 'voice', file: 'phatphrogstudio-oni-demon-voice-demonic-laughter-477923.mp3' },
  { id: 'oni-laugh-2', name: 'Oni Demon Laugh 2', description: 'Oni demon laughter 2', category: 'voice', file: 'phatphrogstudio-oni-demon-voice-demonic-laughter-2-no-ai-479320.mp3' },
  { id: 'oni-laugh-3', name: 'Oni Demon Laugh 3', description: 'Oni demon laughter 3', category: 'voice', file: 'phatphrogstudio-oni-demon-voice-demonic-laughter-3-488654.mp3' },
  { id: 'zombie-moans', name: 'Zombie Idle Moans', description: 'Zombie idle moaning', category: 'voice', file: 'phatphrogstudio-zombie-voice-idle-moans-2-no-ai-479321.mp3' },
  { id: 'snarls-growls', name: 'Snarls & Growls', description: 'Snarls and growls mix', category: 'voice', file: 'voicebosch-snarls-and-growls-172823.mp3' },
  { id: 'monster-moan', name: 'Monster Moan', description: 'Monster moan and squeel', category: 'voice', file: 'wikitwonkaweckords_llc-monster-moan-and-squeel-146632.mp3' },
  { id: 'nazgul', name: 'Nazgul Screech', description: 'Nazgul with low bass', category: 'voice', file: 'freesound_community-nazgul-w-low-bass-37269.mp3' },
  { id: 'lurking-horror', name: 'Lurking Horror', description: 'Lurking horror monster sound', category: 'voice', file: 'alesiadavina-horror-sound-lurking-horror-monster-189948.mp3' },
  { id: 'scream-sfx-1', name: 'Scream SFX 1', description: 'Horror scream SFX', category: 'voice', file: 'jusatti890-scream-horror-sfx-490899.mp3' },
  { id: 'scream-sfx-2', name: 'Scream SFX 2', description: 'Horror scream SFX 2', category: 'voice', file: 'jusatti890-scream-horror-sfx-490908.mp3' },
  { id: 'scream-sfx-3', name: 'Scream SFX 3', description: 'Horror scream SFX 3', category: 'voice', file: 'jusatti890-scream-horror-sfx-490909.mp3' },
  { id: 'scream-sfx-4', name: 'Scream SFX 4', description: 'Horror scream SFX 4', category: 'voice', file: 'jusatti890-scream-horror-sfx-490910.mp3' },
  { id: 'scream-sfx-5', name: 'Scream SFX 5', description: 'Horror scream SFX 5', category: 'voice', file: 'jusatti890-scream-horror-sfx-490916.mp3' },
  { id: 'free-demon-ghost', name: 'Free Demon Ghost', description: 'Free demon ghost sounds', category: 'voice', file: 'freesound_community-free-demon-ghost-sounds-27789.mp3' },
  { id: 'distant-demonic', name: 'Distant Demonic Scream', description: 'Distant demonic scream', category: 'voice', file: 'u_503t47r0fo-distant-demonic-scream-and-debris-346596.mp3' },
  { id: 'alien-noise', name: 'Alien Noise Scream', description: 'Alien noise person screaming', category: 'voice', file: 'flutie8211-low-pitch-alien-noise-person-screaming-499466.mp3' },
];

const categoryMeta = {
  ambient: { label: 'Ambient',          icon: Wind,  color: 'text-blue-400'   },
  effect:  { label: 'Effects',          icon: Zap,   color: 'text-orange-400' },
  music:   { label: 'Music',            icon: Music, color: 'text-purple-400' },
  voice:   { label: 'Voices & Screams', icon: Mic,   color: 'text-red-400'    },
};

export default function SoundLibrary({ activeSounds, onToggleSound, masterVolume, onVolumeChange }: SoundLibraryProps) {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    ambient: true, effect: false, music: false, voice: false,
  });
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const vol = Math.max(0, Math.min(1, masterVolume));
    Object.values(audioRefs.current).forEach(a => { a.volume = vol; });
  }, [masterVolume]);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(a => {
        try { a.pause(); a.src = ''; } catch {}
      });
    };
  }, []);

  const startSound = useCallback((id: string, fileUrl: string) => {
    try {
      if (audioRefs.current[id]) {
        audioRefs.current[id].pause();
        audioRefs.current[id].src = '';
      }
      const audio = new Audio(fileUrl);
      audio.loop = true;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      audio.onerror = () => setLoadErrors(prev => ({ ...prev, [id]: true }));
      audioRefs.current[id] = audio;
      audio.play().catch(() => setLoadErrors(prev => ({ ...prev, [id]: true })));
    } catch (e) {
      console.warn('startSound error:', e);
    }
  }, [masterVolume]);

  const stopSound = useCallback((id: string) => {
    try {
      const a = audioRefs.current[id];
      if (a) { a.pause(); a.currentTime = 0; }
    } catch {}
  }, []);

  const handleToggle = useCallback((id: string, fileUrl: string) => {
    if (activeSounds.includes(id)) stopSound(id);
    else startSound(id, fileUrl);
    onToggleSound(id);
  }, [activeSounds, startSound, stopSound, onToggleSound]);

  const renderSound = (sound: SoundEntry) => {
    const { id, name, description, file } = sound;
    const url = BASE + file;
    const isActive = activeSounds.includes(id);
    const hasError = loadErrors[id];
    return (
      <button key={id} onClick={() => handleToggle(id, url)}
        className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-all w-full ${
          hasError ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
          : isActive ? 'bg-red-500/20 border border-red-500/40 text-red-300'
          : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isActive ? 'bg-red-500 animate-pulse' : hasError ? 'bg-orange-500' : 'bg-zinc-700'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium truncate">{name}</p>
          <p className="text-[8px] text-zinc-600 truncate">{hasError ? '⚠ Load failed' : description}</p>
        </div>
        {isActive && <span className="text-[8px] text-red-400 flex-shrink-0">▶</span>}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sound Library</h3>
        {activeSounds.length > 0 && (
          <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded">
            {activeSounds.length} playing
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {activeSounds.length > 0
          ? <Volume2 className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          : <VolumeX className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
        <input type="range" min="0" max="1" step="0.05" value={masterVolume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
        <span className="text-[9px] text-zinc-500 font-mono w-6">{Math.round(masterVolume * 100)}</span>
      </div>
      {(Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map(cat => {
        const meta = categoryMeta[cat];
        const Icon = meta.icon;
        const sounds = ALL_SOUNDS.filter(s => s.category === cat);
        const activeInCat = sounds.filter(s => activeSounds.includes(s.id)).length;
        const isOpen = openCats[cat];
        return (
          <div key={cat} className="rounded-lg border border-zinc-800 overflow-hidden">
            <button onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
              <div className="flex items-center gap-2">
                <Icon className={`w-3 h-3 ${meta.color}`} />
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                {activeInCat > 0 && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded">
                    {activeInCat} on
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-600">{sounds.length} ▾</span>
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-1 p-2 bg-zinc-900/30 max-h-[260px] overflow-y-auto">
                {sounds.map(s => renderSound(s))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
