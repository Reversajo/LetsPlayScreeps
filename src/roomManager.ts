import * as Config from "config";
import * as miner from "./miner";
import * as builder from "./builder";
import { log } from "./lib/logger/log";
import { profileRecord } from "./lib/Profiler";
import * as M from "./mem";

export let creeps: Creep[];
export let creepCount: number = 0;
export let miners: Creep[] = [];
export let builders: Creep[] = [];

export function run(room: Room, rm: M.RoomMemory): void
{
    profileRecord("loadCreeps", true);
    loadCreeps(room, rm);
    profileRecord("loadCreeps", false);

    profileRecord("buildMissingCreeps", true);
    buildMissingCreeps(room, rm);
    profileRecord("buildMissingCreeps", false);

    _.each(creeps, (creep: Creep) =>
    {
        const creepMem = M.cm(creep);
        if (creepMem.role === M.CreepRoles.ROLE_MINER)
        {
            profileRecord("miner.run", true);
            miner.run(room, creep, rm);
            profileRecord("miner.run", false);
        }
        else if (creepMem.role === M.CreepRoles.ROLE_BUILDER)
        {
            profileRecord("builder.run", true);
            builder.run(room, creep, rm);
            profileRecord("builder.run", false);
        }
        else
        {
            creepMem.role = M.CreepRoles.ROLE_MINER;
        }
    });
}

function loadCreeps(room: Room, rm: M.RoomMemory)
{
    creeps = room.find<Creep>(FIND_MY_CREEPS);
    creepCount = _.size(creeps);
    miners = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_MINER);
    builders = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);

    log.info(`Mem:${M.m().memVersion}/${M.MemoryVersion} M:${miners.length}/${rm.minerTasks.length} B:${builders.length}/${rm.desiredBuilders}`); //  tslint:disable-line
}

function buildMissingCreeps(room: Room, rm: M.RoomMemory)
{
    let bodyParts: string[];

    const inactiveSpawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
        filter: (spawn: Spawn) =>
        {
            return spawn.spawning === null;
        },
    });

    if (miners.length < rm.minerTasks.length)
    {
        bodyParts = [WORK, WORK, CARRY, MOVE];
        // if (miners.length < 1 || room.energyCapacityAvailable <= 800)
        // {
        //     bodyParts = [WORK, WORK, CARRY, MOVE];
        // } else if (room.energyCapacityAvailable > 800)
        // {
        //     bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        // }

        tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_MINER);
    }

    if (miners.length === rm.minerTasks.length)
    {
        if (builders.length < rm.desiredBuilders)
        {
            bodyParts = [WORK, WORK, CARRY, MOVE];
            tryToSpawnCreep(inactiveSpawns, bodyParts, M.CreepRoles.ROLE_BUILDER);
        }
    }
}

function tryToSpawnCreep(inactiveSpawns: Spawn[], bodyParts: string[], role: M.CreepRoles)
{
    let spawned: boolean = false;
    _.each(inactiveSpawns, (spawn: Spawn) =>
    {
        if (!spawned)
        {
            const status = spawnCreep(spawn, bodyParts, role);
            if (status === OK)
            {
                spawned = true;
            }
        }
    });
}

function spawnCreep(spawn: Spawn, bodyParts: string[], role: M.CreepRoles): number
{
    const uuid: number = Memory.uuid;
    let status: number | string = spawn.canCreateCreep(bodyParts, undefined);

    const properties: M.CreepMemory =
        {
            log: false,
            gathering: true,
            role,
            roleString: M.roleToString(role),
        };

    status = _.isString(status) ? OK : status;
    if (status === OK)
    {
        Memory.uuid = uuid + 1;
        const creepName: string = spawn.room.name + " - " + M.roleToString(role) + uuid;

        log.info("Started creating new creep: " + creepName);
        if (Config.ENABLE_DEBUG_MODE)
        {
            log.info("Body: " + bodyParts);
        }

        status = spawn.createCreep(bodyParts, creepName, properties);
        if (status === OK)
        {
            spawn.room.visual.text(
                `🛠️ ${role}`,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: "left", opacity: 0.8 });

        }
        return _.isString(status) ? OK : status;
    }
    else
    {
        if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
        {
            log.info("Failed creating new creep: " + status);
        }

        return status;
    }
}

export function initRoomMemory(room: Room, roomName: string)
{
    const rm: M.RoomMemory = M.m().rooms[roomName];
    rm.roomName = roomName;
    rm.minerTasks = [];
    rm.desiredBuilders = 2;

    let taskIdNum = 0;

    const sources = room.find(FIND_SOURCES);
    for (const sourceName in sources)
    {
        const source: Source = sources[sourceName] as Source;
        const positions = [
            [source.pos.x - 1, source.pos.y - 1],
            [source.pos.x - 1, source.pos.y + 0],
            [source.pos.x - 1, source.pos.y + 1],

            [source.pos.x + 1, source.pos.y - 1],
            [source.pos.x + 1, source.pos.y + 0],
            [source.pos.x + 1, source.pos.y + 1],

            [source.pos.x + 0, source.pos.y - 1],
            [source.pos.x + 0, source.pos.y + 1]
        ];

        for (const pos of positions)
        {
            const roomPos: RoomPosition | null = room.getPositionAt(pos[0], pos[1]);
            if (roomPos !== null)
            {
                const found: string = roomPos.lookFor(LOOK_TERRAIN) as any;
                if (found != "wall") //  tslint:disable-line
                {
                    log.info("pos " + pos[0] + "," + pos[1] + "=" + found);
                    const minerPos: M.PositionPlusTarget =
                        {
                            targetId: source.id,
                            x: pos[0],
                            y: pos[1]
                        };
                    taskIdNum++;
                    const minerTask: M.MinerTask =
                        {
                            minerPosition: minerPos,
                            taskId: taskIdNum
                        };

                    rm.minerTasks.push(minerTask);
                }
            }
        }
    }
}

export function cleanupAssignMiners(rm: M.RoomMemory)
{
    for (const task of rm.minerTasks)
    {
        if (task.assignedMinerName !== undefined)
        {
            const creep = Game.creeps[task.assignedMinerName];
            if (creep as any === undefined)
            {
                log.info(`Clearing mining task assigned to ${task.assignedMinerName}`);
                task.assignedMinerName = undefined;
            }
            else if (M.cm(creep).role !== M.CreepRoles.ROLE_MINER)
            {
                log.info(`Clearing mining task assigned to ${task.assignedMinerName}`);
                task.assignedMinerName = undefined;
            }
        }
    }
}

