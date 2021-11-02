const Discord = require("discord.js");
const Nuggies = require('nuggies')
Nuggies.connect(process.env.mongopath)
const client = new Discord.Client({
    ws: {
        intents: 32767
    }
})
require('discord-buttons')(client);
const user = require('./database/models/user')
const http = require('http')
http.createServer((_, res) => res.end("Hi")).listen(8080)
const fs = require('fs')
const prefix = 'fh '
require('dotenv').config()
const mongoose = require('mongoose')
let dbURL = process.env.mongopath
mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
client.commands = new Discord.Collection()
client.cooldowns = new Discord.Collection()
client.snipes = new Discord.Collection()
client.esnipes = new Discord.Collection()
client.dropCD = []
client.options.allowedMentions = {
  roles: [],
  parse: ['users']
}
const {
    cooldowns
} = client;
let commandsRan = 0;
const commandFolders = fs.readdirSync('./commands');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}
for (const file of eventFiles){
  const event = require(`./events/${file}`);
  if(event.once) {
    client.once(event.name, (...args) => event.execute(...args, client))
  } else {
    client.on(event.name, (...args) => event.execute(...args, client))
  }
}

client.on('ready', () => {
    console.log("Logged in.")
    let counter = 0;
    const presences = [
      {
        name: `${client.users.cache.size.toLocaleString()} fighters!`,
        type: `WATCHING`
      },
      {
        name: `${client.guilds.cache.size.toLocaleString()} servers!`,
        type: 'COMPETING'
      }
    ]
    const updateStatus = () => {
      client.user.setPresence({
        activity: presences[counter]
      })

      if(++counter >= presences.length){
        counter = 0
      }

      setTimeout(updateStatus, 60000)
    }
    updateStatus()

    client.channels.cache.get("901739465406566400").send({
      embed: {
        description: `Bot restarted <t:${(new Date() / 1000).toFixed(0)}:R>`
      }
    })

    const updateColor = () => {
      const random_hex_color_code = () => { 
        // https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-11.php
        let n = (Math.random() * 0xfffff * 1000000).toString(16);
        return '#' + n.slice(0, 6);
       };
  
       client.guilds.cache.get("817734579246071849").roles.cache.get('900274849153445918').setColor(random_hex_color_code())
       client.channels.cache.get("897100842216357889").send(`A total of **${commandsRan.toLocaleString()}** commands have been ran since the bot is up!`)
       setTimeout(updateColor, 10 * 60 * 1000)
    }
    updateColor()
})

client.on('message', async message => {
    if (!message.content.toLowerCase().startsWith(prefix)) return;
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))

    if (!command) return;
    if(message.guild && message.guild.id !== '824294231447044197' && command.fhOnly) return message.channel.send(`This command can only be run in FightHub.`)
    if(command.disabledChannels && command.disabledChannels.includes(message.channel.id)) return;

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name)
    const cooldownAmount = (command.cooldown || 2) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply({
                content: `You have to wait for ${timeLeft.toFixed(1)} more second(s) before executing the ${command.name} command.`
            })
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    if (command.args && !args.length) {
        let reply = 'You did not provide any arguments!'

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``
        }
        return message.reply({
            content: reply
        })
    }
    try {
      commandsRan++
        command.execute(message, args, client)
    } catch (error) {
        console.log(error)
        return message.reply({
            content: "An error occured while executing the command!"
        })
    }
})



client.login(process.env.token)