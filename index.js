const dotenv = require('dotenv')
const { Client, Intents } = require('discord.js')
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice')
const ytdl = require('ytdl-core')

dotenv.config()
const channelId = process.env.CHANNEL_ID
let url = null
const createConnection = async (client, channelId) => {
  try{
    const conn = await (client.channels.fetch(channelId))
    return conn
  }
  catch{ err }{
    return null
  }
}

const loadResource = (youtubeURL) => {
  const steam = ytdl(youtubeURL,{
      quality: 'highestaudio',
      filter: 'audioonly',
  })
  const resource = createAudioResource(steam, {
    inlineVolume: true,
  })
  return resource
}

const playYoutubeMusic = (voiceConnection, player, url) => {
  //TODO: loadResource wip: push music to queue
  const resource = loadResource(url)
  resource.volume.setVolume(1)

  voiceConnection.subscribe(player)
  // play and have fun
  player.play(resource)
}

const stopMusic = (voiceConnection, player) => {
  if (player) player.stop()
  if (
    voiceConnection &&
    voiceConnection.state !== VoiceConnectionStatus.Destroyed
  )
    voiceConnection.destroy()
}

const onMesssageCreate = (conn, voiceConnection, player, msg) => {
  if (msg.author.bot) return
  const { content } = msg
  const command = content.split(' ')[0]
  const arg = content.split(' ').slice(1, content.length)

  switch (command) {
    case '.play':
      url = arg.join('')
      // setup voice connection
      if (voiceConnection == null) {
        voiceConnection = joinVoiceChannel({
          channelId: conn.id,
          guildId: conn.guild.id,
          adapterCreator: conn.guild.voiceAdapterCreator,
        })
      }
      playYoutubeMusic(voiceConnection, player, url)
      msg.reply(`Now playing ${url}`)
      break
    case '.stop':
      if(url){
        stopMusic(voiceConnection, player)
        msg.reply(`stop ${url}`)
        url = null
      } else{
        msg.reply(`There is no playing music`)
      }
      break
  }
}

// run bot
(async () => {
  const client = new Client({
    shards: 'auto',
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_VOICE_STATES,
    ],
  })

  await client.login(process.env.TOKEN)
  const conn = await createConnection(client, channelId)
  if (conn == null) {
    return
  }

  // setup voice connection
  let voiceConnection = null

  // create player audio
  const player = createAudioPlayer()
  player.on(AudioPlayerStatus.Idle, () => {
    try {
      if (player) player.stop()
      if (
        voiceConnection &&
        voiceConnection.state !== VoiceConnectionStatus.Destroyed
      )
        voiceConnection.destroy()
    } catch (e) {
      console.log('error', e)
    }
  })

  client.on('ready', async () => {
    console.log('ready')
  })

  client.on('messageCreate', (msg) => {
    onMesssageCreate(conn, voiceConnection, player, msg)
  })
})()