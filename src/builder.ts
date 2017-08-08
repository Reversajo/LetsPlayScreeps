import * as M from "./mem";
import { log } from "./lib/logger/log";

export function run(room: Room, creep: Creep, rm: M.RoomMemory): void
{
    const cm = M.cm(creep);
    room.name; //  tslint:disable-line
    rm.roomName; //  tslint:disable-line
    cm.log; //  tslint:disable-line
    // if (cm.assignedMineTaskId === undefined)
    // {
    //     log.info(`${creep.name} miner has no mining task`);
    //     const unassignedTasks = _.filter(rm.minerTasks, (t: M.MinerTask) => t.assignedMinerName === undefined);
    //     log.info(`unassignedTask.length: ${unassignedTasks.length}`);
    //     if (unassignedTasks.length === 0)
    //     {
    //         log.error("No unassigned miner tasks found");
    //     }
    //     else
    //     {
    //         unassignedTasks[0].assignedMinerName = creep.name;
    //         cm.assignedMineTaskId = unassignedTasks[0].taskId;
    //         log.info(`Now assigned miner task ${cm.assignedMineTaskId}`);
    //     }
    // }
    // else
    // {
    //     if (cm.gathering && creep.carry.energy === creep.carryCapacity)
    //     {
    //         cm.gathering = false;
    //     }
    //     if (!cm.gathering && creep.carry.energy === 0)
    //     {
    //         cm.gathering = true;
    //     }

    //     if (!cm.gathering)
    //     {
    //         //log.info(`${creep.name} miner is working on dropping off`);
    //         dropOffEnergy(room, creep);
    //     }
    //     else
    //     {
    //         //log.info(`${creep.name} miner is moving to mine`);
    //         harvestEnergy(creep, cm, rm);
    //     }
    // }
}

// function harvestEnergy(creep: Creep, cm: M.CreepMemory, rm: M.RoomMemory): void
// {
//     //log.info(`${creep.name} miner is moving to mine`);
//     const minerTask = rm.minerTasks.find((t: M.MinerTask) => t.taskId === cm.assignedMineTaskId);
//     if (minerTask === undefined)
//     {
//         return;
//     }
//     //log.info(`${creep.name} got miner task ${minerTask.taskId}`);

//     if (creep.pos.x !== minerTask.minerPosition.x ||
//         creep.pos.y !== minerTask.minerPosition.y)
//     {
//         //log.info(`${creep.name} is not in position at ${minerTask.minerPosition.x}, ${minerTask.minerPosition.y}`);
//         const pos = creep.room.getPositionAt(minerTask.minerPosition.x, minerTask.minerPosition.y);
//         if (pos !== null)
//         {
//             creep.moveTo(pos, { visualizePathStyle: { stroke: "#0000ff" } });
//         }
//         else
//         {
//             log.error(`Can't find ${pos}`);
//         }
//     }
//     else
//     {
//         //log.info(`${creep.name} is in position at ${minerTask.minerPosition.x}, ${minerTask.minerPosition.y}`);
//         const source = Game.getObjectById(minerTask.minerPosition.targetId) as Source;
//         const errCode = creep.harvest(source);
//         if (errCode !== OK && errCode !== ERR_NOT_IN_RANGE && errCode !== ERR_NOT_ENOUGH_RESOURCES)
//         {
//             log.error(`Harvest error ${errCode}`);
//         }
//     }
// }

// function dropOffEnergy(room: Room, creep: Creep): void
// {
//     const targets: Structure[] = creep.room.find(FIND_STRUCTURES,
//         {
//             filter: (structure: Structure) =>
//             {
//                 if (structure.structureType === STRUCTURE_EXTENSION)
//                 {
//                     const structExt: StructureExtension = structure as StructureExtension;
//                     return structExt.energy < structExt.energyCapacity;
//                 }
//                 if (structure.structureType === STRUCTURE_SPAWN)
//                 {
//                     const structSpawn: StructureSpawn = structure as StructureSpawn;
//                     return structSpawn.energy < structSpawn.energyCapacity;
//                 }
//                 if (structure.structureType === STRUCTURE_TOWER)
//                 {
//                     const structTower: StructureTower = structure as StructureTower;
//                     return structTower.energy < structTower.energyCapacity;
//                 }

//                 return false;
//             }
//         });

//     if (targets.length > 0)
//     {
//         if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
//         {
//             creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
//         }
//     }
//     else
//     {
//         if (room.controller !== undefined)
//         {
//             const status = creep.upgradeController(room.controller);
//             if (status === ERR_NOT_IN_RANGE)
//             {
//                 const moveCode = creep.moveTo(room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
//                 if (moveCode !== OK && moveCode !== ERR_TIRED)
//                 {
//                     log.error(`move and got ${moveCode}`);
//                 }
//             }
//         }
//     }
// }


export function buildIfCan(room: Room, creep: Creep): boolean
{
    log.info(`buildIfCan ${room.name}, ${creep.name}`);

    const targets = room.find(FIND_CONSTRUCTION_SITES) as ConstructionSite[];
    if (targets.length > 0)
    {
        const status = creep.build(targets[0]);
        if (status === ERR_NOT_IN_RANGE)
        {
            const moveCode = creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            if (moveCode !== OK && moveCode !== ERR_TIRED)
            {
                log.error(`move and got ${moveCode}`);
            }
        }
        return true;
    }
    else
    {
        return false;
    }
}
